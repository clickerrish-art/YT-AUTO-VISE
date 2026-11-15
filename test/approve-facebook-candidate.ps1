# Windows integration tests for the DPAPI-backed editorial approval helper.
# Compatible with Windows PowerShell 5.1 and PowerShell 7.
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "ASSERTION FAILED: $Message" }
}

function Assert-PrivateAcl {
    param([string]$Path)
    $acl = Get-Acl -LiteralPath $Path
    Assert-True $acl.AreAccessRulesProtected "ACL inheritance must be disabled for $Path"
    $currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $systemSid = "S-1-5-18"
    $rules = $acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier])
    $seenCurrent = $false
    $seenSystem = $false
    foreach ($rule in $rules) {
        $sid = $rule.IdentityReference.Value
        Assert-True ($rule.AccessControlType -eq [System.Security.AccessControl.AccessControlType]::Allow) "Unexpected deny ACE on $Path"
        Assert-True (($sid -eq $currentSid) -or ($sid -eq $systemSid)) "Unexpected principal $sid on $Path"
        if ($sid -eq $currentSid) { $seenCurrent = $true }
        if ($sid -eq $systemSid) { $seenSystem = $true }
    }
    Assert-True $seenCurrent "Current user must have an explicit ACL entry on $Path"
    Assert-True $seenSystem "SYSTEM must have an explicit ACL entry on $Path"
}

function Get-PlainTextForTest {
    param([Security.SecureString]$Value)
    $pointer = [IntPtr]::Zero
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        if ($pointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        }
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$signerScript = Join-Path $repoRoot "scripts/approve-facebook-candidate.ps1"
$tempRoot = Join-Path $env:RUNNER_TEMP ("nature-frontiers-signer-" + [Guid]::NewGuid().ToString("N"))
$priorLocalAppData = $env:LOCALAPPDATA
$priorHmac = [Environment]::GetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", "Process")
$priorReviewer = [Environment]::GetEnvironmentVariable("FACEBOOK_APPROVER_ID", "Process")
$env:LOCALAPPDATA = $tempRoot

$secretOne = "windows-ci-secret-initial-0123456789"
$secretTwo = "windows-ci-secret-rotated-0123456789"
$global:SignerReadHostValues = New-Object 'System.Collections.Generic.Queue[object]'
$global:SignerNpmExitCode = 0
$global:SignerNpmCapture = $null

function global:Read-Host {
    param([string]$Prompt, [switch]$AsSecureString)
    if ($global:SignerReadHostValues.Count -eq 0) {
        throw "Unexpected interactive prompt in Windows signer test: $Prompt"
    }
    $value = $global:SignerReadHostValues.Dequeue()
    if ($AsSecureString) {
        return ConvertTo-SecureString -String ([string]$value) -AsPlainText -Force
    }
    return [string]$value
}

function global:npm {
    $global:SignerNpmCapture = [pscustomobject]@{
        Secret = [Environment]::GetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", "Process")
        Reviewer = [Environment]::GetEnvironmentVariable("FACEBOOK_APPROVER_ID", "Process")
        Arguments = @($args)
    }
    $global:LASTEXITCODE = $global:SignerNpmExitCode
}

try {
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    $secretDirectory = Join-Path $tempRoot "NatureFrontiers"
    $secretFile = Join-Path $secretDirectory "facebook-approval-hmac.dpapi"

    # Invalid short key must not create a DPAPI secret file.
    $global:SignerReadHostValues.Enqueue("too-short")
    $shortKeyRejected = $false
    try { & $signerScript -InitializeSecret | Out-Null } catch { $shortKeyRejected = $true }
    Assert-True $shortKeyRejected "Short initialization secret must be rejected"
    Assert-True (-not (Test-Path -LiteralPath $secretFile)) "Short secret must not be persisted"

    # Initialize with the current owner-provided key; validate DPAPI and restrictive ACLs.
    $global:SignerReadHostValues.Enqueue($secretOne)
    & $signerScript -InitializeSecret | Out-Null
    Assert-True (Test-Path -LiteralPath $secretFile -PathType Leaf) "DPAPI secret file was not created"
    Assert-PrivateAcl -Path $secretDirectory
    Assert-PrivateAcl -Path $secretFile
    $encrypted = [IO.File]::ReadAllText($secretFile, [Text.Encoding]::UTF8).Trim()
    Assert-True ($encrypted -ne $secretOne) "Secret file must not contain plaintext"
    $decrypted = ConvertTo-SecureString -String $encrypted
    Assert-True ((Get-PlainTextForTest -Value $decrypted) -ceq $secretOne) "DPAPI round-trip did not preserve the secret"
    $decrypted.Dispose()

    # Existing key replacement is forbidden unless rotation was explicitly requested.
    $beforeRefusal = [IO.File]::ReadAllText($secretFile, [Text.Encoding]::UTF8)
    $overwriteRejected = $false
    try { & $signerScript -InitializeSecret | Out-Null } catch { $overwriteRejected = $true }
    Assert-True $overwriteRejected "Existing key must not be overwritten by default"
    Assert-True ([IO.File]::ReadAllText($secretFile, [Text.Encoding]::UTF8) -ceq $beforeRefusal) "Refused overwrite changed the existing key"

    # Explicit rotation must replace the key and keep the same ACL protections.
    $global:SignerReadHostValues.Enqueue($secretTwo)
    & $signerScript -InitializeSecret -ReplaceExistingSecret | Out-Null
    Assert-PrivateAcl -Path $secretDirectory
    Assert-PrivateAcl -Path $secretFile
    $rotated = ConvertTo-SecureString -String ([IO.File]::ReadAllText($secretFile, [Text.Encoding]::UTF8).Trim())
    Assert-True ((Get-PlainTextForTest -Value $rotated) -ceq $secretTwo) "Explicit rotation did not persist the replacement key"
    $rotated.Dispose()

    # Loosened ACLs must fail closed before the approval command is invoked.
    $originalFileAcl = Get-Acl -LiteralPath $secretFile
    $looseFileAcl = Get-Acl -LiteralPath $secretFile
    $usersSid = New-Object System.Security.Principal.SecurityIdentifier("S-1-5-32-545")
    $usersReadRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $usersSid,
        [System.Security.AccessControl.FileSystemRights]::Read,
        [System.Security.AccessControl.AccessControlType]::Allow
    )
    $looseFileAcl.AddAccessRule($usersReadRule)
    Set-Acl -LiteralPath $secretFile -AclObject $looseFileAcl
    $global:SignerNpmCapture = $null
    $looseFileRejected = $false
    try { & $signerScript -CandidateFile "test/approve-facebook-candidate.test.mjs" -SlotId "windows-ci-loose-file-acl" | Out-Null } catch { $looseFileRejected = $true }
    Assert-True $looseFileRejected "Signer must reject a secret file with a permissive ACL"
    Assert-True ($null -eq $global:SignerNpmCapture) "Signer must reject permissive ACLs before invoking npm"
    Set-Acl -LiteralPath $secretFile -AclObject $originalFileAcl
    Assert-PrivateAcl -Path $secretFile

    $originalDirectoryAcl = Get-Acl -LiteralPath $secretDirectory
    $looseDirectoryAcl = Get-Acl -LiteralPath $secretDirectory
    $directoryInheritanceFlags = [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit
    $directoryReadRule = [System.Security.AccessControl.FileSystemAccessRule]::new(
        $usersSid,
        [System.Security.AccessControl.FileSystemRights]::ReadAndExecute,
        $directoryInheritanceFlags,
        [System.Security.AccessControl.PropagationFlags]::None,
        [System.Security.AccessControl.AccessControlType]::Allow
    )
    $looseDirectoryAcl.AddAccessRule($directoryReadRule)
    Set-Acl -LiteralPath $secretDirectory -AclObject $looseDirectoryAcl
    $global:SignerNpmCapture = $null
    $looseDirectoryRejected = $false
    try { & $signerScript -CandidateFile "test/approve-facebook-candidate.test.mjs" -SlotId "windows-ci-loose-directory-acl" | Out-Null } catch { $looseDirectoryRejected = $true }
    Assert-True $looseDirectoryRejected "Signer must reject a secret directory with a permissive ACL"
    Assert-True ($null -eq $global:SignerNpmCapture) "Signer must reject permissive directory ACLs before invoking npm"
    Set-Acl -LiteralPath $secretDirectory -AclObject $originalDirectoryAcl
    Assert-PrivateAcl -Path $secretDirectory

    # The normal path must decrypt only for the child process and restore prior environment values.
    [Environment]::SetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", "prior-process-secret-value", "Process")
    [Environment]::SetEnvironmentVariable("FACEBOOK_APPROVER_ID", "prior-reviewer-value", "Process")
    $global:SignerReadHostValues.Enqueue("windows-ci-reviewer")
    $global:SignerNpmExitCode = 0
    $output = & $signerScript -CandidateFile "test/approve-facebook-candidate.test.mjs" -SlotId "windows-ci-smoke-slot" | Out-String
    Assert-True ($global:SignerNpmCapture.Secret -ceq $secretTwo) "Child npm process did not receive the decrypted key"
    Assert-True ($global:SignerNpmCapture.Reviewer -ceq "windows-ci-reviewer") "Child npm process did not receive the reviewer ID"
    Assert-True ($global:SignerNpmCapture.Arguments -contains "facebook:approve") "Expected approval npm script was not invoked"
    Assert-True ([Environment]::GetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", "Process") -ceq "prior-process-secret-value") "Previous HMAC environment value was not restored"
    Assert-True ([Environment]::GetEnvironmentVariable("FACEBOOK_APPROVER_ID", "Process") -ceq "prior-reviewer-value") "Previous reviewer environment value was not restored"
    Assert-True (-not $output.Contains($secretTwo)) "Signer output exposed the decrypted secret"

    # A failing child command must still restore the process environment.
    $global:SignerReadHostValues.Enqueue("windows-ci-reviewer-failure")
    $global:SignerNpmExitCode = 23
    $childFailureObserved = $false
    try { & $signerScript -CandidateFile "test/approve-facebook-candidate.test.mjs" -SlotId "windows-ci-smoke-failure" | Out-Null } catch { $childFailureObserved = $true }
    Assert-True $childFailureObserved "Non-zero npm exit must fail the signer"
    Assert-True ([Environment]::GetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", "Process") -ceq "prior-process-secret-value") "HMAC environment was not restored after child failure"
    Assert-True ([Environment]::GetEnvironmentVariable("FACEBOOK_APPROVER_ID", "Process") -ceq "prior-reviewer-value") "Reviewer environment was not restored after child failure"

    Write-Output "PASS: Windows DPAPI initialization, private ACLs, overwrite refusal, explicit rotation, child-process handoff, secret-output protection and environment restoration."
}
finally {
    [Environment]::SetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", $priorHmac, "Process")
    [Environment]::SetEnvironmentVariable("FACEBOOK_APPROVER_ID", $priorReviewer, "Process")
    [Environment]::SetEnvironmentVariable("LOCALAPPDATA", $priorLocalAppData, "Process")
    Remove-Item Function:\global:Read-Host -ErrorAction SilentlyContinue
    Remove-Item Function:\global:npm -ErrorAction SilentlyContinue
    Remove-Variable SignerReadHostValues -Scope Global -ErrorAction SilentlyContinue
    Remove-Variable SignerNpmExitCode -Scope Global -ErrorAction SilentlyContinue
    Remove-Variable SignerNpmCapture -Scope Global -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force }
    # GitHub's PowerShell runner propagates a non-zero LASTEXITCODE left by the
    # deliberately failing child-process test, even though that failure was expected.
    $global:LASTEXITCODE = 0
}
