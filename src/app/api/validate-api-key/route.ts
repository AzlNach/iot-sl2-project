import { NextResponse } from "next/server";

/**
 * Simple endpoint to validate that required API keys exist.
 * This is used by the UI to provide friendly diagnostics.
 */
export async function GET() {
	const hasOpenWeatherKey = Boolean(process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY);
	const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);

	return NextResponse.json({
		ok: true,
		keys: {
			openWeather: hasOpenWeatherKey,
			openRouter: hasOpenRouterKey,
		},
	});
}

