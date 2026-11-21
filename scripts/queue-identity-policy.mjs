/**
 * Fail-closed reconciliation between the operational dispatch queue and the
 * detailed long-form content queue. This proves identity only; it does not
 * approve rights, production, scheduling or publication.
 */
export function validateQueueIdentity({ operationalQueue, detailedQueue, approval } = {}) {
  const errors = [];
  const operationalItems = operationalQueue?.items;
  const detailedItems = detailedQueue?.items;

  if (!operationalQueue || typeof operationalQueue !== "object" || !Array.isArray(operationalItems)) {
    errors.push("Operational content/queue.json must contain an items array.");
  }
  if (!detailedQueue || typeof detailedQueue !== "object" || !Array.isArray(detailedItems)) {
    errors.push("Detailed content/long-form-queue.json must contain an items array.");
  }
  if (!Array.isArray(operationalItems) || !Array.isArray(detailedItems)) {
    return { valid: false, errors, mappingCount: 0 };
  }

  const operationalLongForms = operationalItems.filter(item => item?.contentType === "long_form");
  const operationalIds = new Set();
  for (const item of operationalItems) {
    if (!item || typeof item.id !== "string" || !item.id.trim()) {
      errors.push("Every operational queue item must have a non-empty stable ID.");
    } else if (operationalIds.has(item.id)) {
      errors.push("Operational queue contains duplicate item ID: " + item.id);
    } else operationalIds.add(item.id);
  }

  const detailedById = new Map();
  for (const item of detailedItems) {
    if (!item || typeof item.id !== "string" || !item.id.trim()) {
      errors.push("Every detailed long-form queue item must have a non-empty stable ID.");
    } else if (detailedById.has(item.id)) {
      errors.push("Detailed long-form queue contains duplicate item ID: " + item.id);
    } else detailedById.set(item.id, item);
  }

  if (!approval || typeof approval !== "object" || Array.isArray(approval)) {
    errors.push("Owner-approved content/queue-identity-approval.json is missing or invalid.");
  } else {
    if (approval.schemaVersion !== 1) errors.push("Queue identity approval schemaVersion must be 1.");
    if (approval.status !== "OWNER_APPROVED" || approval.ownerApproved !== true) {
      errors.push("Queue identity approval must be explicitly OWNER_APPROVED by the owner.");
    }
    if (typeof approval.approvedBy !== "string" || !approval.approvedBy.trim()) {
      errors.push("Queue identity approval must identify the approving owner.");
    }
    if (typeof approval.approvalReference !== "string" || !approval.approvalReference.trim()) {
      errors.push("Queue identity approval must include a non-empty decision reference.");
    }
    const approvedAt = typeof approval.approvedAt === "string" ? Date.parse(approval.approvedAt) : NaN;
    if (!Number.isFinite(approvedAt) || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(approval.approvedAt)) {
      errors.push("Queue identity approval must include a valid timezone-qualified approvedAt timestamp.");
    }
  }

  const mappings = Array.isArray(approval?.mappings) ? approval.mappings : [];
  if (mappings.length !== operationalLongForms.length) {
    errors.push("Owner-approved queue identity mappings must cover every operational long-form item exactly once.");
  }
  const mappingByOperationalId = new Map();
  const mappedDetailedIds = new Set();
  for (const mapping of mappings) {
    if (!mapping || typeof mapping !== "object" ||
        typeof mapping.operationalItemId !== "string" ||
        typeof mapping.detailedItemId !== "string" ||
        !Number.isInteger(mapping.cyclePosition) || mapping.cyclePosition < 1) {
      errors.push("Each queue identity mapping needs operationalItemId, detailedItemId and a positive integer cyclePosition.");
      continue;
    }
    if (mappingByOperationalId.has(mapping.operationalItemId)) {
      errors.push("Duplicate mapping for operational queue item: " + mapping.operationalItemId);
    } else mappingByOperationalId.set(mapping.operationalItemId, mapping);
    if (mappedDetailedIds.has(mapping.detailedItemId)) {
      errors.push("A detailed long-form item cannot be assigned to multiple cycle positions: " + mapping.detailedItemId);
    } else mappedDetailedIds.add(mapping.detailedItemId);
  }

  operationalLongForms.forEach((operationalItem, index) => {
    const mapping = mappingByOperationalId.get(operationalItem.id);
    if (!mapping) {
      errors.push("No owner-approved detailed-queue identity mapping exists for operational item: " + operationalItem.id);
      return;
    }
    if (mapping.cyclePosition !== index + 1) {
      errors.push("Operational long-form queue order must be explicitly mapped to consecutive cycle positions; expected position " + (index + 1) + " for " + operationalItem.id + ".");
    }
    const detailedItem = detailedById.get(mapping.detailedItemId);
    if (!detailedItem) {
      errors.push("Mapped detailed long-form item does not exist: " + mapping.detailedItemId);
    } else if (typeof detailedItem.scriptPath !== "string" || !detailedItem.scriptPath.trim()) {
      errors.push("Mapped detailed long-form item must have a concrete scriptPath: " + mapping.detailedItemId);
    }
  });

  if (operationalLongForms.length < 2) {
    errors.push("Operational queue must identify at least two long-form items for the rolling publication cycle.");
  }
  const firstMapping = mappingByOperationalId.get(operationalLongForms[0]?.id);
  const firstDetailedItem = firstMapping ? detailedById.get(firstMapping.detailedItemId) : null;
  if (firstDetailedItem?.publicationCyclePosition !== 1) {
    errors.push("Cycle position 1 must map to the detailed queue's explicitly designated publicationCyclePosition 1 item.");
  }

  return {
    valid: errors.length === 0,
    errors,
    mappingCount: mappings.length,
    operationalLongFormIds: operationalLongForms.map(item => item.id),
    mappedDetailedIds: mappings.map(mapping => mapping?.detailedItemId ?? null)
  };
}
