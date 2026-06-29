export type ServiceLineCostInput = {
  collaboratorId?: string | null;
  revenueAmount?: number | null;
  costAmount?: number | null;
  label?: string | null;
};

export type ServiceLineCostIssue = {
  index: number;
  label: string;
};

function hasPositiveCost(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function findCollaboratorLinesWithoutCost(lines: ServiceLineCostInput[]): ServiceLineCostIssue[] {
  return lines.flatMap((line, index) => {
    const collaboratorId = line.collaboratorId?.trim();
    if (!collaboratorId || hasPositiveCost(line.costAmount)) return [];

    return [{
      index,
      label: line.label?.trim() || `Línia ${index + 1}`,
    }];
  });
}

export function collaboratorLineCostErrorMessage(issue: ServiceLineCostIssue) {
  return `${issue.label}: un servei de col·laborador necessita cost real. Afegeix-lo des del catàleg de productes o elimina i recrea la línia.`;
}
