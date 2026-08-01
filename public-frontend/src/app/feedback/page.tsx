import FeedbackSection from "@/components/feedback-section";
import Footer from "@/components/layout/main-footer";
import ContactSection from "@/components/contact-section";

export default function FeedbackPage() {
    return (
        <main className="min-h-screen pt-28">
            <FeedbackSection />
            <ContactSection />
            <Footer />
        </main>
    );
}
