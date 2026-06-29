import { NextResponse } from "next/server"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  return NextResponse.json(
    { success: true, message: "Hello World" },
    { status: 200, headers: CORS_HEADERS }
  )
}

export async function POST() {
  return NextResponse.json(
    { success: true, message: "Hello World" },
    { status: 201, headers: CORS_HEADERS }
  )
}
