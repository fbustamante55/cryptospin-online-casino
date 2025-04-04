import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Send, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  HelpCircle 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Interface para las FAQ
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("contact");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Formulario de contacto
  const [contactForm, setContactForm] = useState({
    name: user?.username || "",
    email: user?.email || "",
    subject: "",
    message: ""
  });

  // Datos de ejemplo para FAQ
  const faqs: FAQ[] = [
    {
      id: "faq1",
      question: t("support.faq_account_question"),
      answer: t("support.faq_account_answer"),
      category: "account"
    },
    {
      id: "faq2",
      question: t("support.faq_deposit_question"),
      answer: t("support.faq_deposit_answer"),
      category: "payments"
    },
    {
      id: "faq3",
      question: t("support.faq_withdraw_question"),
      answer: t("support.faq_withdraw_answer"),
      category: "payments"
    },
    {
      id: "faq4",
      question: t("support.faq_bonus_question"),
      answer: t("support.faq_bonus_answer"),
      category: "bonuses"
    },
    {
      id: "faq5",
      question: t("support.faq_kyc_question"),
      answer: t("support.faq_kyc_answer"),
      category: "account"
    },
    {
      id: "faq6",
      question: t("support.faq_limits_question"),
      answer: t("support.faq_limits_answer"),
      category: "responsible"
    }
  ];

  // Categorías para las FAQ
  const faqCategories = [
    { id: "all", name: t("support.all_categories") },
    { id: "account", name: t("support.account") },
    { id: "payments", name: t("support.payments") },
    { id: "bonuses", name: t("support.bonuses") },
    { id: "games", name: t("support.games") },
    { id: "responsible", name: t("support.responsible_gaming") }
  ];

  // Estado para el filtro de categoría de FAQ
  const [activeFaqCategory, setActiveFaqCategory] = useState("all");

  // Filtrar FAQ por categoría y búsqueda
  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeFaqCategory === "all" || faq.category === activeFaqCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && (searchQuery === "" || matchesSearch);
  });

  // Manejar cambios en el formulario de contacto
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  // Enviar formulario de contacto
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    
    toast({
      title: t("support.contact_submitted"),
      description: t("support.contact_success"),
      variant: "default",
    });
    
    // Reiniciar formulario
    setContactForm({
      name: user?.username || "",
      email: user?.email || "",
      subject: "",
      message: ""
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">{t("support.title")}</h1>
          <p className="text-gray-400">{t("support.description")}</p>
        </div>

        {/* Tabs de Soporte */}
        <Tabs defaultValue="contact" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#192531] border border-[#1c2b3a]">
            <TabsTrigger value="contact" className="data-[state=active]:bg-[#09b66d]">
              {t("support.contact_us")}
            </TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-[#09b66d]">
              {t("support.faq")}
            </TabsTrigger>
            <TabsTrigger value="livechat" className="data-[state=active]:bg-[#09b66d]">
              {t("support.live_chat")}
            </TabsTrigger>
          </TabsList>

          {/* Tab de Contacto */}
          <TabsContent value="contact" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card className="bg-[#192531] border-[#1c2b3a]">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">{t("support.contact_form")}</h2>
                    <form onSubmit={handleContactSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">{t("support.name")}</label>
                          <Input
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={handleContactFormChange}
                            className="bg-[#0e1824] border-[#1c2b3a] text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">{t("support.email")}</label>
                          <Input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleContactFormChange}
                            className="bg-[#0e1824] border-[#1c2b3a] text-white"
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">{t("support.subject")}</label>
                        <Input
                          type="text"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactFormChange}
                          className="bg-[#0e1824] border-[#1c2b3a] text-white"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">{t("support.message")}</label>
                        <Textarea
                          name="message"
                          value={contactForm.message}
                          onChange={handleContactFormChange}
                          className="bg-[#0e1824] border-[#1c2b3a] text-white min-h-[150px]"
                          required
                        />
                      </div>
                      <Button type="submit" className="bg-[#09b66d] hover:bg-[#09b66d]/80">
                        <Send className="h-4 w-4 mr-2" />
                        {t("support.send_message")}
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>
              <div>
                <Card className="bg-[#192531] border-[#1c2b3a] mb-4">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{t("support.contact_info")}</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-[#09b66d] mt-1 mr-3" />
                        <div>
                          <p className="text-sm text-gray-400">{t("support.email_us")}</p>
                          <a href="mailto:support@cryptospin.com" className="text-white hover:text-[#09b66d]">
                            support@cryptospin.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-[#09b66d] mt-1 mr-3" />
                        <div>
                          <p className="text-sm text-gray-400">{t("support.call_us")}</p>
                          <a href="tel:+18001234567" className="text-white hover:text-[#09b66d]">
                            +1 800 123 4567
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MessageSquare className="h-5 w-5 text-[#09b66d] mt-1 mr-3" />
                        <div>
                          <p className="text-sm text-gray-400">{t("support.live_support")}</p>
                          <button 
                            onClick={() => setActiveTab("livechat")}
                            className="text-white hover:text-[#09b66d]"
                          >
                            {t("support.chat_now")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="bg-[#192531] border-[#1c2b3a]">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{t("support.response_time")}</h3>
                    <p className="text-gray-400 text-sm">
                      {t("support.response_description")}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab de FAQ */}
          <TabsContent value="faq" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <div className="sticky top-4">
                  <h3 className="text-lg font-semibold text-white mb-4">{t("support.categories")}</h3>
                  <div className="space-y-2">
                    {faqCategories.map((category) => (
                      <button
                        key={category.id}
                        className={`w-full text-left px-4 py-2 rounded-md ${
                          activeFaqCategory === category.id
                            ? "bg-[#09b66d] text-white"
                            : "bg-[#0e1824] text-gray-300 hover:bg-[#1c2b3a]"
                        }`}
                        onClick={() => setActiveFaqCategory(category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="mb-6 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={t("support.search_faq")}
                    className="pl-10 bg-[#0e1824] border-[#1c2b3a] text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {filteredFaqs.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem 
                        key={faq.id} 
                        value={faq.id}
                        className="bg-[#192531] border border-[#1c2b3a] rounded-md overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 text-white hover:bg-[#1c2b3a] hover:no-underline">
                          <div className="flex items-center">
                            <HelpCircle className="h-4 w-4 text-[#09b66d] mr-2" />
                            <span>{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3 pt-1 text-gray-300">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                    <h2 className="text-xl font-semibold text-white">{t("support.no_faq_found")}</h2>
                    <p className="text-gray-400 max-w-md">{t("support.try_different_search")}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab de Live Chat */}
          <TabsContent value="livechat" className="mt-6">
            <Card className="bg-[#192531] border-[#1c2b3a]">
              <div className="p-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-16 w-16 text-[#09b66d] mb-4" />
                  <h2 className="text-2xl font-semibold text-white mb-2">{t("support.live_chat")}</h2>
                  <p className="text-gray-400 max-w-md mb-6">
                    {t("support.live_chat_description")}
                  </p>
                  <Button className="bg-[#09b66d] hover:bg-[#09b66d]/80">
                    {t("support.start_chat")}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}