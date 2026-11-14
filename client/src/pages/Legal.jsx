import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "../styles/Legal.css";

// ---- Change these three before you launch ----
const APP_NAME = "Connectly";
const CONTACT_EMAIL = "your-email@example.com";
const GOVERNING_PLACE = "your city and state, India";
// ----------------------------------------------

const LAST_UPDATED = "14 November 2026";

const terms = {
  title: "Terms & Conditions",
  sections: [
    {
      heading: "1. Acceptance of these terms",
      paragraphs: [
        `By creating an account or using ${APP_NAME}, you agree to these Terms & Conditions and to our Privacy Policy. If you do not agree, please do not use the service.`,
      ],
    },
    {
      heading: "2. Who can use the service",
      paragraphs: [
        `${APP_NAME} is only for people who are 18 years of age or older. You confirm your age when you set up your profile. If we believe an account belongs to someone under 18, we may disable it immediately.`,
      ],
    },
    {
      heading: "3. Your account",
      bullets: [
        "You sign in with your Google account. You are responsible for all activity on your account.",
        "The information you give us, including your gender, must be true. You choose your gender once, and it cannot be changed from the app afterwards.",
        "Using a false gender or identity to get matched is a violation of these terms.",
        "Do not share your account or let someone else use it.",
      ],
    },
    {
      heading: "4. How matching and video calls work",
      paragraphs: [
        `${APP_NAME} matches a man with a woman for a one-on-one live video call. You can skip, end, block or report the other person at any time.`,
        `Video and audio are sent between the two users' browsers. We do not record or store your video or audio. The people you meet are other users, not ${APP_NAME}, and you are responsible for what you say and show on a call.`,
      ],
    },
    {
      heading: "5. Rules of conduct",
      paragraphs: ["You agree not to:"],
      bullets: [
        "Show nudity, sexual acts or sexually explicit content, or ask others for it.",
        "Harass, threaten, bully, stalk or abuse anyone, or use hate speech.",
        "Record, screenshot or share another person's video, audio or image without their clear permission.",
        "Impersonate another person, or pretend to be someone you are not.",
        "Promote violence, self-harm, illegal activity, scams, or sell or advertise products or services.",
        "Use the service if you are under 18, or try to find or contact people under 18.",
        "Try to break, overload or misuse the service, or get around block, report or safety features.",
      ],
    },
    {
      heading: "6. Safety tools and enforcement",
      paragraphs: [
        "You can block or report anyone you meet. A blocked person will not be matched with you again. Reports are saved and may be reviewed by us.",
        "We may warn, restrict or permanently disable any account that breaks these terms or puts others at risk, with or without notice. We may share information with the police or other authorities where the law requires it or where someone may be in danger.",
      ],
    },
    {
      heading: "7. Service availability",
      paragraphs: [
        "The service is provided on an \"as is\" and \"as available\" basis. We do not promise that you will find a match, how long it will take, or that the service will always be fast, secure or free of errors. Video quality depends on your device and internet connection, and calls between some networks may fail to connect.",
      ],
    },
    {
      heading: "8. Limitation of liability",
      paragraphs: [
        `To the extent allowed by law, ${APP_NAME} is not responsible for what other users say or do, or for any loss or harm that results from meeting or talking to them. Please be careful: do not share personal details such as your address, phone number, bank details or passwords with people you meet.`,
      ],
    },
    {
      heading: "9. Changes to these terms",
      paragraphs: [
        "We may update these terms from time to time. If you keep using the service after an update, you accept the new terms.",
      ],
    },
    {
      heading: "10. Governing law",
      paragraphs: [
        `These terms are governed by the laws of India. Any dispute will be handled by the courts of ${GOVERNING_PLACE}.`,
      ],
    },
    {
      heading: "11. Contact",
      paragraphs: [`Questions or complaints: ${CONTACT_EMAIL}`],
    },
  ],
};

const privacy = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "1. What this policy covers",
      paragraphs: [
        `This policy explains what information ${APP_NAME} collects, why, and what choices you have.`,
      ],
    },
    {
      heading: "2. Information we collect",
      bullets: [
        "Google sign-in details: your name, email address and Google account ID.",
        "Profile details: your display name, bio, gender, and whether you confirmed you are 18 or older.",
        "Matching and call activity: when you start and stop searching, how long you waited, which users were matched, when a call started and ended, how long it lasted and how it ended.",
        "Safety records: who you blocked, and reports you made or that were made about you, with the reason chosen.",
        "Technical data: a login token stored in your browser so you stay signed in, and your IP address, which is needed to make connections over the internet.",
      ],
    },
    {
      heading: "3. Camera and microphone",
      paragraphs: [
        "We ask for access to your camera and microphone only so you can take part in video calls. Video and audio are sent between the two users' browsers and are encrypted in transit. We do not record or store them.",
        "To set up a call, your browser may contact a public connection-helper (STUN) server run by Google, which can see your IP address. In some cases a relay server may be used to pass the call.",
        "Please remember that the other person could record their own screen. We forbid this in our terms, but we cannot technically prevent it.",
      ],
    },
    {
      heading: "4. How we use your information",
      bullets: [
        "To sign you in and run your account.",
        "To match you with other users and run video calls.",
        "To keep the service safe: handling blocks and reports, and disabling accounts that break the rules.",
        "To understand how the service is used, for example average waiting time for men and women, so we can improve matching.",
      ],
    },
    {
      heading: "5. Who sees your information",
      bullets: [
        "The person you are matched with sees your display name, and your live video and audio during the call.",
        "Our administrators can see reports, account details and usage records needed for safety and support.",
        "Service providers that run the app for us, such as our hosting provider, our database provider and Google (sign-in and connection helper).",
        "Authorities, where the law requires it or to protect someone's safety.",
        "We do not sell your personal information.",
      ],
    },
    {
      heading: "6. How long we keep it",
      paragraphs: [
        "We keep your account and profile while your account is active. Call and matching records, and safety records such as reports and blocks, may be kept for as long as needed for safety, abuse prevention and legal reasons.",
      ],
    },
    {
      heading: "7. Your choices and rights",
      paragraphs: [
        `You can ask us to access, correct or delete your information, or to delete your account, by emailing ${CONTACT_EMAIL}. Because your gender is used for matching, changes to it are handled through that email. We will respond as required by applicable law, including India's Digital Personal Data Protection Act, 2023.`,
      ],
    },
    {
      heading: "8. Security",
      paragraphs: [
        "We use HTTPS and access controls to protect your information. No online service is completely secure, so we cannot guarantee absolute security.",
      ],
    },
    {
      heading: "9. Children",
      paragraphs: [
        `${APP_NAME} is not for anyone under 18. We do not knowingly collect information from minors, and we will delete an account if we learn it belongs to someone under 18.`,
      ],
    },
    {
      heading: "10. Changes to this policy",
      paragraphs: [
        "We may update this policy from time to time. The date at the top shows when it was last changed.",
      ],
    },
    {
      heading: "11. Contact",
      paragraphs: [`Privacy questions or requests: ${CONTACT_EMAIL}`],
    },
  ],
};

function Legal({ type }) {
  const isPrivacy = type === "privacy";
  const doc = isPrivacy ? privacy : terms;

  return (
    <main className="legal-page">
      <div className="legal-wrap">
        <Link to="/" className="legal-back">
          <ArrowLeft size={16} />
          Back to {APP_NAME}
        </Link>

        <h1>{doc.title}</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        {doc.sections.map((section) => (
          <section key={section.heading} className="legal-section">
            <h2>{section.heading}</h2>

            {section.paragraphs &&
              section.paragraphs.map((text, i) => <p key={i}>{text}</p>)}

            {section.bullets && (
              <ul>
                {section.bullets.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="legal-switch">
          {isPrivacy ? (
            <Link to="/terms">Read the Terms &amp; Conditions</Link>
          ) : (
            <Link to="/privacy">Read the Privacy Policy</Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default Legal;