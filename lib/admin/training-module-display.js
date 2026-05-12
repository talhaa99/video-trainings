/**
 * Shared labels and filter keys for general training (module 0 = firefighter, 1 = CPR)
 * and safety induction. Used by admin certificates and reports.
 */

export const TrainingModuleFilter = Object.freeze({
  ALL: 'all',
  SAFETY_INDUCTION: 'safety_induction',
  /** Any row tied to the general_training assignment pool */
  GENERAL_POOL: 'general_training',
  FIRE: 'general_training_fire',
  CPR: 'general_training_cpr',
  /** Whole-program / non–module-specific quiz rows */
  PROGRAM: 'general_training_program',
})

export function titleSafetyInduction() {
  return 'Safety Induction'
}

export function titleGeneralTrainingModule(moduleIndex) {
  const mi = Number(moduleIndex)
  if (mi === 0) return 'Firefighter training'
  if (mi === 1) return 'CPR training'
  return 'General training'
}

export function titleGeneralTrainingProgram() {
  return 'Firefighter & CPR training'
}

/**
 * @param {Record<string, unknown> | null | undefined} attempt
 */
export function generalTrainingFilterKindFromAttempt(attempt) {
  if (attempt?.source === 'module_quiz') {
    const mi = Number(attempt?.moduleIndex)
    if (mi === 0) return TrainingModuleFilter.FIRE
    if (mi === 1) return TrainingModuleFilter.CPR
  }
  return TrainingModuleFilter.PROGRAM
}

/**
 * Display title for one general-training quiz attempt (reports) or derived context.
 * @param {Record<string, unknown> | null | undefined} attempt
 */
export function titleGeneralTrainingFromAttempt(attempt) {
  if (attempt?.source === 'module_quiz') {
    const mi = Number(attempt?.moduleIndex)
    if (mi === 0 || mi === 1) return titleGeneralTrainingModule(mi)
  }
  return titleGeneralTrainingProgram()
}

/**
 * @param {{ moduleFilterKind?: string, trainingType?: string, moduleType?: string }} row
 * @param {string} selected
 */
export function matchesTrainingModuleFilter(row, selected) {
  if (selected === TrainingModuleFilter.ALL) return true
  const trainingType = row.trainingType ?? row.moduleType
  if (selected === TrainingModuleFilter.SAFETY_INDUCTION) {
    return row.moduleFilterKind === TrainingModuleFilter.SAFETY_INDUCTION
  }
  if (selected === TrainingModuleFilter.GENERAL_POOL) {
    return trainingType === 'general_training'
  }
  return row.moduleFilterKind === selected
}
