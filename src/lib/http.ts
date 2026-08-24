import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { HttpError } from "./tenant";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return json({ error: error.message }, error.status);
  }
  console.error(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return json(
        {
          error:
            "A required database table or column is missing. Run the SQL files in prisma/migrations in order.",
        },
        500,
      );
    }
    if (error.code === "P2002") {
      return json({ error: "That record already exists." }, 409);
    }
  }
  if (error instanceof Error && error.message.startsWith("Missing ")) {
    return json({ error: `${error.message} Set it in Vercel → Environment Variables.` }, 500);
  }
  return json({ error: "Something went wrong." }, 500);
}
