import './index.css';
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error('Root element not found');
}

// [MOCK] MSW answers all /api/v1 requests in the prototype. Set VITE_API_MODE=real
// (and VITE_API_BASE_URL to the Spring Boot instance) to bypass it — components
// need no changes because they only ever talk HTTP.
// [PHASE-1]
async function enableMocking() {
	if (import.meta.env.VITE_API_MODE === 'real') return;
	const { worker } = await import('./mocks/browser');
	await worker.start({
		// Vite dev assets, locale JSON, tiles etc. pass straight through.
		onUnhandledRequest: 'bypass',
	});
}

enableMocking().then(() => {
	createRoot(rootElement).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
});
