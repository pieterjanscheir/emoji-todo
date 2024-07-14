'use server'

import { sql } from 'drizzle-orm'
import { db, todosTable, usersTable, todoAssignmentsTable } from './db'
import { redirect } from 'next/navigation'

export async function submit(form: FormData) {
	const text = form.get('text') + ''
	if (!/^[\p{Emoji}]+$/u.test(text)) return

	const [insertedTodo] = await db.insert(todosTable).values({ text }).returning()

	const userIds = form.getAll('userIds').map((id) => parseInt(id.toString(), 10))

	if (userIds.length > 0) {
		await db.insert(todoAssignmentsTable).values(userIds.map((userId) => ({ todoId: insertedTodo.id, userId })))
	}

	redirect('/')
}

export async function addUser(form: FormData) {
	const name = form.get('name')?.toString()
	const email = form.get('email')?.toString()

	if (!name || !email) return

	await db.insert(usersTable).values({ name, email })

	redirect('/')
}

export async function linkUser(form: FormData) {
	const todoId = parseInt(form.get('todoId')?.toString() || '0', 10)
	const userId = parseInt(form.get('userId')?.toString() || '0', 10)

	if (todoId && userId) {
		await db.insert(todoAssignmentsTable).values({ todoId, userId })
	}

	redirect('/')
}

export async function unlinkUser(form: FormData) {
	const todoId = parseInt(form.get('todoId')?.toString() || '0', 10)
	const userId = parseInt(form.get('userId')?.toString() || '0', 10)

	if (todoId && userId) {
		await db
			.delete(todoAssignmentsTable)
			.where(sql`${todoAssignmentsTable.todoId} = ${todoId} AND ${todoAssignmentsTable.userId} = ${userId}`)
	}

	redirect('/')
}
