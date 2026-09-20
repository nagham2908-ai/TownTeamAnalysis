import Script from "next/script";

export const metadata = {
  title: "Workforce Compensation — Requirements Questionnaire",
};

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Validated only to fail fast on an obviously-empty route param — app.js
  // itself derives the token from the URL (`/q/<token>`) client-side.
  await params;

  return (
    <>
      <link rel="stylesheet" href="/questionnaire/style.css" />
      <div id="app" />
      <div className="toast" id="toast" />
      <Script src="/questionnaire/app.js" strategy="afterInteractive" />
    </>
  );
}
