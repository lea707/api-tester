import "./globals.css";

export const metadata = {
  title: "API Tester",
  description: "Automated API regression testing tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <ul>
            <li>
              <a href="/">home</a>
            </li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}
