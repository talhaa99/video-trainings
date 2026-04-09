'use server'

import { revalidatePath } from 'next/cache'
import { createAndSendTrainingAssignment } from '../../../../lib/admin/phase2a-service'

export async function sendTrainingAction(_prevState, formData) {
  try {
    const recipientType = `${formData.get('recipientType') ?? ''}`
    const employeeDbId = `${formData.get('employeeDbId') ?? ''}`
    const externalName = `${formData.get('externalName') ?? ''}`
    const externalEmail = `${formData.get('externalEmail') ?? ''}`

    const assignment = await createAndSendTrainingAssignment({
      recipientType,
      employeeDbId,
      externalName,
      externalEmail,
    })

    revalidatePath('/admin/training')

    return {
      success: `Start Training sent to ${assignment.recipientEmail}.`,
      error: null,
      link: assignment.linkUrl,
    }
  } catch (error) {
    return {
      success: null,
      error: error.message || 'Failed to send Start Training.',
      link: null,
    }
  }
}
