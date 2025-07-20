import "./globals.css";
import { ReactNode } from "react";

// Temporarily disable next/font to fix quick-lru dependency error
// const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="es" suppressHydrationWarning={true}>
			<body suppressHydrationWarning={true} className="font-sans">
				{children}
			</body>
		</html>
	);
}
