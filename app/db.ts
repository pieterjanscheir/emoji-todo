import { neon } from '@neondatabase/serverless'
import { relations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)

// Users table
export const usersTable = pgTable('users', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
})

// Todos table
export const todosTable = pgTable('todos', {
	id: serial('id').primaryKey(),
	text: varchar('text', { length: 10 }).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Junction table for many-to-many relationship between todos and users
export const todoAssignmentsTable = pgTable('todo_assignments', {
	id: serial('id').primaryKey(),
	todoId: integer('todo_id').references(() => todosTable.id),
	userId: integer('user_id').references(() => usersTable.id),
})

// Define relations
export const todoRelations = relations(todosTable, ({ many }) => ({
	assignments: many(todoAssignmentsTable),
}))

export const userRelations = relations(usersTable, ({ many }) => ({
	assignments: many(todoAssignmentsTable),
}))

export const todoAssignmentRelations = relations(todoAssignmentsTable, ({ one }) => ({
	todo: one(todosTable, {
		fields: [todoAssignmentsTable.todoId],
		references: [todosTable.id],
	}),
	user: one(usersTable, {
		fields: [todoAssignmentsTable.userId],
		references: [usersTable.id],
	}),
}))
