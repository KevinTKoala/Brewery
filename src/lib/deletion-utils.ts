import { supabase } from './supabase'

interface DeletionLogParams {
  itemId: string
  itemType: string
  deletionReason: string
  deletedBy: string | undefined
  originalTitle?: string
  originalContent?: string
  authorId?: string
}

interface NotificationParams {
  userId: string
  title: string
  message: string
  relatedItemType?: string
  relatedItemId?: string
  deletionReason?: string
}

/**
 * Logs a deletion to the deletion_log table and sends a notification to the author
 */
export async function logDeletionWithNotification(
  deletionParams: DeletionLogParams,
  notificationParams: NotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Log to deletion_log
    const { error: logError } = await supabase
      .from('deletion_log')
      .insert({
        item_id: deletionParams.itemId,
        item_type: deletionParams.itemType,
        deletion_reason: deletionParams.deletionReason,
        deleted_by: deletionParams.deletedBy,
        original_title: deletionParams.originalTitle,
        original_content: deletionParams.originalContent,
        author_id: deletionParams.authorId
      })

    if (logError) {
      return { success: false, error: logError.message }
    }

    // Send notification to user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationParams.userId,
        type: 'deletion',
        title: notificationParams.title,
        message: notificationParams.message,
        related_item_type: notificationParams.relatedItemType,
        related_item_id: notificationParams.relatedItemId,
        deletion_reason: notificationParams.deletionReason
      })

    if (notificationError) {
      // Continue even if notification fails - deletion is already logged
      console.error('Failed to send notification:', notificationError.message)
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
