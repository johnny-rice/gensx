import * as gensx from "@gensx/core";
import { GSXChatCompletion, GSXTool, OpenAIProvider } from "@gensx/openai";
import { DatabaseProvider, useDatabase } from "@gensx/storage";
import { z } from "zod";

// Define the query tool schema
const querySchema = z.object({
  query: z.string().describe("The SQL query to execute"),
});

type QueryParams = z.infer<typeof querySchema>;

// Create the query tool
const queryTool = new GSXTool({
  name: "execute_query",
  description: "Execute a SQL query against the baseball database",
  schema: querySchema,
  run: async ({ query }: QueryParams) => {
    const db = await useDatabase("baseball");
    const result = await db.execute(query);
    return JSON.stringify(result, null, 2);
  },
});

// SQL Copilot component that wraps GSXChatCompletion
const SQLCopilot = gensx.Component<{ question: string }, string>(
  "SQLCopilot",
  ({ question }) => (
    <GSXChatCompletion
      messages={[
        {
          role: "system",
          content: `You are a helpful SQL assistant. You have access to a baseball statistics database with the following schema:
          TABLE baseball_stats (
            player TEXT,
            team TEXT,
            position TEXT,
            at_bats INTEGER,
            hits INTEGER,
            runs INTEGER,
            home_runs INTEGER,
            rbi INTEGER,
            batting_avg REAL,
            obp REAL,
            slg REAL,
            ops REAL
          )

          The table contains statistics for various baseball players. You can use the execute_query tool to run SQL queries against this database.
          When asked a question, first think about what SQL query would answer it, then use the tool to execute that query.
          After getting the results, explain them in a clear and concise way.`,
        },
        {
          role: "user",
          content: question,
        },
      ]}
      model="gpt-4o-mini"
      temperature={0.7}
      tools={[queryTool]}
    >
      {(result) => result.choices[0].message.content}
    </GSXChatCompletion>
  ),
);

interface TextToSqlWorkflowProps {
  question: string;
}

// Main workflow component
const TextToSqlWorkflowComponent = gensx.Component<
  TextToSqlWorkflowProps,
  string
>("TextToSqlWorkflowComponent", ({ question }) => (
  <DatabaseProvider>
    <OpenAIProvider apiKey={process.env.OPENAI_API_KEY}>
      <SQLCopilot question={question} />
    </OpenAIProvider>
  </DatabaseProvider>
));

// Database initialization component
const CreateAndPopulateDatabase = gensx.Component<{}, string>(
  "CreateAndPopulateDatabase",
  async () => {
    // UseDatabase will create the database automatically if it doesn't exist.
    const db = await useDatabase("baseball");

    // Create the baseball_stats table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS baseball_stats (
        player TEXT,
        team TEXT,
        position TEXT,
        at_bats INTEGER,
        hits INTEGER,
        runs INTEGER,
        home_runs INTEGER,
        rbi INTEGER,
        batting_avg REAL,
        obp REAL,
        slg REAL,
        ops REAL
      )
    `);

    // query to check if the table is already populated
    const dbResult = await db.execute(`
        SELECT COUNT(*) FROM baseball_stats
      `);
    const numRows = dbResult.rows[0][0] as number;

    if (numRows > 0) {
      return "Database already exists";
    }

    // Insert the baseball statistics data
    await db.execute(`
      INSERT INTO baseball_stats (player, team, position, at_bats, hits, runs, home_runs, rbi, batting_avg, obp, slg, ops)
      VALUES
        ('Marcus Bennett', 'Portland Pioneers', '1B', 550, 85, 25, 32, 98, 0.312, 0.385, 0.545, 0.930),
        ('Ethan Carter', 'San Antonio Stallions', 'SS', 520, 92, 18, 24, 76, 0.298, 0.365, 0.512, 0.877),
        ('Lucas Rivera', 'Charlotte Cougars', 'OF', 480, 78, 22, 28, 85, 0.285, 0.352, 0.498, 0.850),
        ('Nathan Foster', 'Indianapolis Ironmen', '3B', 510, 75, 20, 26, 82, 0.301, 0.378, 0.525, 0.903),
        ('Dylan Mitchell', 'Austin Archers', '2B', 490, 82, 15, 19, 65, 0.295, 0.362, 0.485, 0.847),
        ('Jordan Hayes', 'Nashville Navigators', 'OF', 530, 88, 28, 35, 102, 0.308, 0.392, 0.558, 0.950),
        ('Cameron Brooks', 'Orlando Owls', 'OF', 500, 76, 17, 22, 71, 0.292, 0.355, 0.495, 0.850),
        ('Ryan Cooper', 'Sacramento Stars', 'C', 450, 65, 12, 15, 58, 0.278, 0.342, 0.465, 0.807),
        ('Tyler Morgan', 'Memphis Monarchs', '1B', 540, 80, 23, 30, 95, 0.305, 0.375, 0.532, 0.907),
        ('Brandon Reed', 'Las Vegas Legends', '3B', 510, 74, 19, 25, 78, 0.289, 0.358, 0.502, 0.860)
    `);

    return "Database initialized";
  },
);

// Main workflow component
const InitializeDatabaseComponent = gensx.Component<{}, null>(
  "InitializeDatabaseComponent",
  () => (
    <DatabaseProvider>
      <CreateAndPopulateDatabase />
    </DatabaseProvider>
  ),
);

// Create the workflow
const InitializeDatabase = gensx.Workflow(
  "InitializeDatabase",
  InitializeDatabaseComponent,
);

// Create the workflow
const TextToSqlWorkflow = gensx.Workflow(
  "TextToSqlWorkflow",
  TextToSqlWorkflowComponent,
);

export { TextToSqlWorkflow, InitializeDatabase };
