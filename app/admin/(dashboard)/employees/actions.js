'use server'

import { revalidatePath } from 'next/cache'
import { createEmployee, deleteEmployee, updateEmployee } from '../../../../lib/admin/phase2a-service'

function formatDbError(error, fallbackMessage) {
  const message = error?.message || fallbackMessage
  if (message.includes('duplicate key value') && message.includes('employees_email_key')) {
    return 'This email is already used by another employee.'
  }
  return message
}

export async function createEmployeeAction(_prevState, formData) {
  try {
    const name = `${formData.get('name') ?? ''}`
    const email = `${formData.get('email') ?? ''}`
    const employee = await createEmployee({ name, email })
    revalidatePath('/admin/employees')
    revalidatePath('/admin/inductions')
    revalidatePath('/admin/training')

    return {
      success: `Employee ${employee.employee_id} created successfully.`,
      error: null,
    }
  } catch (error) {
    return {
      success: null,
      error: formatDbError(error, 'Failed to create employee.'),
    }
  }
}

export async function updateEmployeeAction(_prevState, formData) {
  try {
    const id = `${formData.get('id') ?? ''}`
    const name = `${formData.get('name') ?? ''}`
    const email = `${formData.get('email') ?? ''}`
    const employee = await updateEmployee({ id, name, email })
    revalidatePath('/admin/employees')
    revalidatePath('/admin/inductions')
    revalidatePath('/admin/training')
    revalidatePath('/admin/training-records')

    return {
      success: `Employee ${employee.employee_id} updated successfully.`,
      error: null,
    }
  } catch (error) {
    return {
      success: null,
      error: formatDbError(error, 'Failed to update employee.'),
    }
  }
}

export async function deleteEmployeeAction(_prevState, formData) {
  try {
    const id = `${formData.get('id') ?? ''}`
    const deleted = await deleteEmployee({ id })
    revalidatePath('/admin/employees')
    revalidatePath('/admin/inductions')
    revalidatePath('/admin/training')
    revalidatePath('/admin/training-records')

    return {
      success: `Employee ${deleted.employee_id} deleted successfully.`,
      error: null,
    }
  } catch (error) {
    return {
      success: null,
      error: formatDbError(error, 'Failed to delete employee.'),
    }
  }
}
