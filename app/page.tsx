import { db, todosTable, usersTable, todoAssignmentsTable } from './db'
import { submit, addUser, linkUser, unlinkUser } from './actions'
import { sql } from 'drizzle-orm'

export default async function Home({ searchParams }: { searchParams: { asc: string } }) {
	const todos = await db
		.select({
			id: todosTable.id,
			text: todosTable.text,
			createdAt: todosTable.createdAt,
			users: sql<
				{ id: number; name: string }[]
			>`json_agg(json_build_object('id', ${usersTable.id}, 'name', ${usersTable.name}))`.as('users'),
		})
		.from(todosTable)
		.leftJoin(todoAssignmentsTable, sql`${todoAssignmentsTable.todoId} = ${todosTable.id}`)
		.leftJoin(usersTable, sql`${usersTable.id} = ${todoAssignmentsTable.userId}`)
		.groupBy(todosTable.id)
		.limit(20)
		.orderBy(searchParams.asc ? sql`${todosTable.id} ASC` : sql`${todosTable.id} DESC`)

	const users = await db.select().from(usersTable)

	return (
		<main key={todos[0]?.id}>
			<h1>
				Emoji TODO{' '}
				<a
					href='https://github.com/rauchg/emoji-todo'
					target='_blank'
				>
					source
				</a>
			</h1>

			{/* Add User Form */}
			<form action={addUser}>
				<input
					type='text'
					name='name'
					placeholder='User Name'
					required
				/>
				<input
					type='email'
					name='email'
					placeholder='User Email'
					required
				/>
				<button type='submit'>Add User</button>
			</form>

			{/* Todo List */}
			<ul>
				{todos.map((todo) => (
					<li key={todo.id}>
						{todo.text} - Created at: {todo.createdAt.toLocaleString()}
						<br />
						Assigned to: {todo.users.map((user) => user.name).join(', ') || 'Unassigned'}
						{/* Link User Form */}
						<form action={linkUser}>
							<input
								type='hidden'
								name='todoId'
								value={todo.id}
							/>
							<select name='userId'>
								{users
									.filter((user) => !todo.users.some((todoUser) => todoUser.id === user.id))
									.map((user) => (
										<option
											key={user.id}
											value={user.id}
										>
											{user.name}
										</option>
									))}
							</select>
							<button type='submit'>Link User</button>
						</form>
						{/* Unlink User Buttons */}
						{todo.users.map((user) => (
							<form
								key={user.id}
								action={unlinkUser}
							>
								<input
									type='hidden'
									name='todoId'
									value={todo.id}
								/>
								<input
									type='hidden'
									name='userId'
									value={user.id}
								/>
								<button type='submit'>Unlink {user.name}</button>
							</form>
						))}
					</li>
				))}
			</ul>

			{/* Add Todo Form */}
			<form action={submit}>
				<input
					type='text'
					placeholder='🫡 (only emojis allowed)'
					pattern='^[\p{Emoji}]+$'
					name='text'
					autoFocus
					maxLength={10}
					required
				/>
				<select
					name='userIds'
					multiple
				>
					{users.map((user) => (
						<option
							key={user.id}
							value={user.id}
						>
							{user.name}
						</option>
					))}
				</select>
				<button>✉️</button>
			</form>
		</main>
	)
}
