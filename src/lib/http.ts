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
  return json({ error: "Something went wrong." }, 500);
}
