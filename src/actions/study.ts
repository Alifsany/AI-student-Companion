'use server';

import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getConversations() {
  const session = await verifySession();

  try {
    const conversations = await db.conversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

export async function getConversation(id: string) {
  const session = await verifySession();

  try {
    const conversation = await db.conversation.findUnique({
      where: { id: id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // IDOR protection
    if (!conversation || conversation.userId !== session.userId) {
      return null;
    }

    return conversation;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }
}

export async function deleteConversation(id: string, isActive: boolean = false) {
  const session = await verifySession();

  try {
    // deleteMany implicitly provides IDOR protection when userId is included in the where clause
    const deleted = await db.conversation.deleteMany({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (deleted.count > 0) {
      revalidatePath('/study');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw new Error('Failed to delete conversation');
  }

  if (isActive) {
    redirect('/study');
  }
}

export async function renameConversation(id: string, formData: FormData) {
  const session = await verifySession();

  const title = formData.get('title');
  if (typeof title !== 'string' || !title.trim() || title.length > 100) {
    throw new Error('Invalid title');
  }

  try {
    await db.conversation.updateMany({
      where: {
        id: id,
        userId: session.userId,
      },
      data: {
        title: title.trim(),
      },
    });
    revalidatePath('/study');
  } catch (error) {
    console.error('Error renaming conversation:', error);
    throw new Error('Failed to rename conversation');
  }
}
