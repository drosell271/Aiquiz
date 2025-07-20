"use client";

import "./i18n";
import { I18nProvider } from "./I18nProvider";
import { ReactNode } from "react";

// Temporarily disable next/font to fix quick-lru dependency error
// const inter = Inter({ subsets: ["latin"] });

export default function ManagerLayout({ children }: { children: ReactNode }) {
	return (
		<div className="font-sans">
			<I18nProvider>{children}</I18nProvider>
		</div>
	);
}
