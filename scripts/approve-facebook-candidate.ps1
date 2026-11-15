#requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$InitializeSecret,
    [switch]$ReplaceExistingSecret,
    [string]$CandidateFile = "content/facebook-intake-candidates.json",
    [string]$SlotId
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$secretDirectory = Join-Path $env:LOCALAPPDATA "NatureFrontiers"
$secretFile = Join-Path $secretDirectory "facebook-approval-hmac.dpapi"

function Set-CurrentUserOnlyAcl {
    param([Parameter(Mandatory)][string]$Path, [switch]$Directory)
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = if ($Directory) {
        New-Object System.Security.AccessControl.DirectorySecurity
    } else {
        New-Object System.Security.AccessControl.FileSecurity
    }
    $acl.SetAccessRuleProtection($true, $false)
    # Explicitly set ownership as well as the DACL; newly created directories can
    # inherit an unexpected owner from a runner-provided parent directory.
    $acl.SetOwner($identity)
    $inheritance = if ($Directory) {
        [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit
    } else {
        [System.Security.AccessControl.InheritanceFlags]::None
    }
    $propagation = [System.Security.AccessControl.PropagationFlags]::None
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $identity,
        [System.Security.AccessControl.FileSystemRights]::FullControl,
        $inheritance,
        $propagation,
        [System.Security.AccessControl.AccessControlType]::Allow
    )
    $acl.AddAccessRule($rule)
    $systemSid = New-Object System.Security.Principal.SecurityIdentifier("S-1-5-18")
    $systemRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $systemSid,
        [System.Security.AccessControl.FileSystemRights]::FullControl,
        $inheritance,
        $propagation,
        [System.Security.AccessControl.AccessControlType]::Allow
    )
    $acl.AddAccessRule($systemRule)
    Set-Acl -LiteralPath $Path -AclObject $acl
}

function Assert-CurrentUserOnlyAcl {
    param([Parameter(Mandatory)][string]$Path)
    $currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $systemSid = "S-1-5-18"
    $acl = Get-Acl -LiteralPath $Path
    if (-not $acl.AreAccessRulesProtected) {
        throw "The local signer path must have inheritance disabled: $Path"
    }
    $ownerSid = $acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value
    if ($ownerSid -ne $currentSid) {
        throw "The local signer path must be owned by the current Windows user: $Path"
    }
    $rules = $acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier])
    $seenCurrent = $false
    $seenSystem = $false
    foreach ($rule in $rules) {
        $sid = $rule.IdentityReference.Value
        if (($sid -ne $currentSid) -and ($sid -ne $systemSid)) {
            throw "The local signer path grants access to an unexpected principal: $Path"
        }
        if ($rule.AccessControlType -ne [System.Security.AccessControl.AccessControlType]::Allow -or $rule.IsInherited) {
            throw "The local signer path contains an unexpected access rule: $Path"
        }
        if (($rule.FileSystemRights -band [System.Security.AccessControl.FileSystemRights]::FullControl) -ne [System.Security.AccessControl.FileSystemRights]::FullControl) {
            throw "The local signer path must grant full control only to its owner and SYSTEM: $Path"
        }
        if ($sid -eq $currentSid) { $seenCurrent = $true }
        if ($sid -eq $systemSid) { $seenSystem = $true }
    }
    if (-not $seenCurrent -or -not $seenSystem) {
        throw "The local signer path must grant access only to the current user and SYSTEM: $Path"
    }
}

if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
    throw "This helper requires Windows DPAPI. Run it in Windows PowerShell 5.1 or PowerShell 7 on Windows."
}
if ($PSVersionTable.PSVersion.Major -lt 5) {
    throw "PowerShell 5.1 or later is required."
}

if ($InitializeSecret) {
    New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null
    if ((Get-Item -LiteralPath $secretDirectory -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "The local secret directory must not be a symbolic link or reparse point."
    }
    if (Test-Path -LiteralPath $secretFile) {
        if ((Get-Item -LiteralPath $secretFile -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "The local secret file must not be a symbolic link or reparse point."
        }
        if (-not $ReplaceExistingSecret) {
            throw "A local signer secret already exists. Refusing to overwrite it. Use -ReplaceExistingSecret only when intentionally rotating the local key."
        }
    }
    Set-CurrentUserOnlyAcl -Path $secretDirectory -Directory
    if (Test-Path -LiteralPath $secretFile) {
        # Tighten permissions before replacing an existing file, not only after writing it.
        Set-CurrentUserOnlyAcl -Path $secretFile
    }
    $secureSecret = Read-Host "Enter the existing FACEBOOK_APPROVAL_HMAC_SECRET (input is hidden)" -AsSecureString
    try {
        if ($secureSecret.Length -lt 32) {
            throw "The secret must contain at least 32 characters. Nothing was saved."
        }
        $encrypted = ConvertFrom-SecureString -SecureString $secureSecret
        [System.IO.File]::WriteAllText($secretFile, $encrypted, [System.Text.Encoding]::UTF8)
        Set-CurrentUserOnlyAcl -Path $secretFile
        Write-Output "Encrypted signer secret saved for this Windows user only: $secretFile"
        Write-Output "The secret was not written to the repository or displayed."
    }
    finally {
        if ($secureSecret) { $secureSecret.Dispose() }
    }
    return
}

if (-not (Test-Path -LiteralPath $secretFile -PathType Leaf)) {
    throw "No local signer secret is configured. Run this script once with -InitializeSecret first."
}
if ((Get-Item -LiteralPath $secretDirectory -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw "The local secret directory must not be a symbolic link or reparse point."
}
if ((Get-Item -LiteralPath $secretFile -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw "The local secret file must not be a symbolic link or reparse point."
}
Assert-CurrentUserOnlyAcl -Path $secretDirectory
Assert-CurrentUserOnlyAcl -Path $secretFile
if ([string]::IsNullOrWhiteSpace($SlotId)) {
    throw "Supply the exact candidate slot ID with -SlotId."
}
$candidatePath = Join-Path $repoRoot $CandidateFile
$resolvedCandidate = (Resolve-Path -LiteralPath $candidatePath).Path
if (-not $resolvedCandidate.StartsWith($repoRoot + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Candidate file must be inside the repository."
}
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "node_modules") -PathType Container)) {
    throw "Node dependencies are missing. Run npm ci in the repository first."
}

$encryptedSecret = [System.IO.File]::ReadAllText($secretFile, [System.Text.Encoding]::UTF8).Trim()
$secureSecret = ConvertTo-SecureString -String $encryptedSecret
$previousHmacSecret = [Environment]::GetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", "Process")
$previousApproverId = [Environment]::GetEnvironmentVariable("FACEBOOK_APPROVER_ID", "Process")
$bstr = [IntPtr]::Zero
try {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
    $env:FACEBOOK_APPROVAL_HMAC_SECRET = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    $reviewer = Read-Host "Reviewer ID (your real, attributable reviewer label)"
    if ([string]::IsNullOrWhiteSpace($reviewer) -or $reviewer.Length -gt 200) {
        throw "A reviewer ID between 1 and 200 characters is required."
    }
    $env:FACEBOOK_APPROVER_ID = $reviewer
    Push-Location $repoRoot
    try {
        & npm run facebook:approve -- $CandidateFile $SlotId
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($exitCode -ne 0) {
        throw "The approval command failed with exit code $exitCode. No approval should be assumed."
    }
}
finally {
    [Environment]::SetEnvironmentVariable("FACEBOOK_APPROVAL_HMAC_SECRET", $previousHmacSecret, "Process")
    [Environment]::SetEnvironmentVariable("FACEBOOK_APPROVER_ID", $previousApproverId, "Process")
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
    $secureSecret.Dispose()
    $encryptedSecret = $null
}
