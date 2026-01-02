import FeedbackSection from "@/components/feedback-section";
import Footer from "@/components/layout/main-footer";
import ContactSection from "@/components/contact-section";

export default function FeedbackPage() {
    return (
        <main className="min-h-screen pt-20"> {/* pt-20 to clear fixed navbar if needed */}
            <FeedbackSection />
            <ContactSection />
            <Footer />
        </main>
    );
}
