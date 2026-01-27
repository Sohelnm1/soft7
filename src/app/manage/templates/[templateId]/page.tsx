"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Video, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import TemplateForm, { TemplateFormState } from "@/components/templates/TemplateForm";
import FormattedText from "@/components/templates/FormattedText";

export default function EditTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
    const router = useRouter();
    const { templateId } = use(params);
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<TemplateFormState | undefined>(undefined);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const res = await fetch(`/api/templates/${templateId}`);
                if (!res.ok) {
                    toast.error("Failed to load template");
                    router.push("/manage/templates");
                    return;
                }
                const data = await res.json();

                // Parse components back to form state
                const header = data.components.find((c: any) => c.type === 'HEADER');
                const body = data.components.find((c: any) => c.type === 'BODY');
                const footer = data.components.find((c: any) => c.type === 'FOOTER');
                const buttons = data.components.find((c: any) => c.type === 'BUTTONS');

                // Detect variable format
                const hasNamedParams = data.components.some((c: any) =>
                    c.example?.body_text_named_params || c.example?.header_text_named_params
                );

                setInitialData({
                    name: data.name,
                    category: data.category,
                    language: data.language,
                    headerType: header ? header.format : 'NONE',
                    headerText: header?.format === 'TEXT' ? header.text : '',
                    bodyText: body?.text || '',
                    footerText: footer?.text || '',
                    buttons: buttons ? buttons.buttons.map((b: any) => ({
                        type: b.type,
                        text: b.text,
                        url: b.url,
                        phoneNumber: b.phone_number
                    })) : [],
                    whatsappAccountId: data.whatsappAccountId,
                    variableFormat: hasNamedParams ? 'named' : 'positional',
                    bodyExamples: body?.example?.body_text_named_params
                        ? Object.fromEntries(body.example.body_text_named_params.map((p: any) => [p.param_name, p.example]))
                        : (body?.example?.body_text?.[0] || []).reduce((acc: any, val: string, idx: number) => {
                            acc[(idx + 1).toString()] = val;
                            return acc;
                        }, {}),
                    headerExamples: header?.example?.header_text_named_params
                        ? Object.fromEntries(header.example.header_text_named_params.map((p: any) => [p.param_name, p.example]))
                        : (header?.example?.header_text || []).reduce((acc: any, val: string, idx: number) => {
                            acc[(idx + 1).toString()] = val;
                            return acc;
                        }, {})
                });
            } catch (error) {
                console.error(error);
                toast.error("Error loading template");
            } finally {
                setLoading(false);
            }
        };

        fetchTemplate();
    }, [templateId, router]);

    const handleSubmit = async (form: TemplateFormState) => {
        setLoading(true);
        const components: any[] = [];
        // 1. Detect all variables first to drive the structure
        const bodyVars = form.bodyText.match(/\{\{([^}]+)\}\}/g)?.map(m => m.replace(/\{\{|\}\}/g, "").trim()) || [];
        const headerVars = (form.headerType === 'TEXT' && form.headerText)
            ? (form.headerText.match(/\{\{([^}]+)\}\}/g)?.map(m => m.replace(/\{\{|\}\}/g, "").trim()) || [])
            : [];

        const useNamed = form.variableFormat === 'named';

        // Header
        if (form.headerType === 'TEXT' && form.headerText) {
            const headerComponent: any = { type: 'HEADER', format: 'TEXT', text: form.headerText };
            if (headerVars.length > 0) {
                if (useNamed) {
                    headerComponent.example = {
                        header_text_named_params: [...new Set(headerVars)].map(name => ({
                            param_name: name,
                            example: form.headerExamples?.[name] || "Sample"
                        }))
                    };
                } else {
                    const sortedVars = [...new Set(headerVars)].sort((a, b) => parseInt(a) - parseInt(b));
                    const headerSamples = sortedVars.map(v => form.headerExamples?.[v] || "Sample");
                    headerComponent.example = { header_text: headerSamples };
                }
            }
            components.push(headerComponent);
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerType)) {
            const component: any = { type: 'HEADER', format: form.headerType };
            if (form.headerHandle) {
                component.example = { header_handle: [form.headerHandle] };
            }
            components.push(component);
        }

        // Body
        const bodyComponent: any = { type: 'BODY', text: form.bodyText };
        if (bodyVars.length > 0) {
            if (useNamed) {
                bodyComponent.example = {
                    body_text_named_params: [...new Set(bodyVars)].map(name => ({
                        param_name: name,
                        example: form.bodyExamples?.[name] || "Sample"
                    }))
                };
            } else {
                const sortedVars = [...new Set(bodyVars)].sort((a, b) => parseInt(a) - parseInt(b));
                const bodySamples = sortedVars.map(v => form.bodyExamples?.[v] || "Sample");
                bodyComponent.example = { body_text: [bodySamples] };
            }
        }
        components.push(bodyComponent);

        if (form.footerText) components.push({ type: 'FOOTER', text: form.footerText });
        if (form.buttons.length > 0) {
            components.push({
                type: 'BUTTONS',
                buttons: form.buttons.map((b, idx) => {
                    if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text };
                    if (b.type === 'URL') {
                        const button: any = { type: 'URL', text: b.text, url: b.url };
                        if (b.url?.includes('{{1}}') && form.buttonExamples?.[idx]) {
                            button.example = [form.buttonExamples[idx]];
                        }
                        return button;
                    }
                    if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phoneNumber };
                    return null;
                }).filter(Boolean)
            });
        }

        try {
            const res = await fetch(`/api/templates/${templateId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: form.category,
                    components,
                    parameter_format: form.variableFormat
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Template updated successfully!");
                router.push("/manage/templates");
            } else {
                toast.error(data.error || "Failed to update template");
            }
        } catch (e) {
            console.error('Update error:', e);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const renderPreview = (form: TemplateFormState) => (
        <div className="mockup-phone border-gray-800 bg-gray-800 w-full max-w-[300px] h-[600px] rounded-[3rem] p-4 shadow-2xl relative border-[8px]">
            <div className="absolute top-0 w-32 h-6 bg-gray-800 left-1/2 -translate-x-1/2 rounded-b-xl z-10"></div>
            <div className="bg-[#e5ddd5] w-full h-full rounded-[2rem] overflow-hidden flex flex-col relative">
                <div className="h-14 bg-[#075e54] flex items-center px-4 text-white gap-3 shrink-0">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div className="text-sm font-medium">Business Name</div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-sans text-sm pb-20">
                    <div className="bg-white rounded-lg p-2 shadow-sm max-w-[90%] self-start relative">
                        {form.headerType !== 'NONE' && (
                            <div className="mb-2 rounded bg-gray-200 h-32 flex items-center justify-center text-gray-500 font-medium">
                                {form.headerType === 'TEXT' ? (
                                    <span className="p-2 text-black font-bold">{form.headerText}</span>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        {form.headerType === 'IMAGE' && <ImageIcon className="w-8 h-8" />}
                                        {form.headerType === 'VIDEO' && <Video className="w-8 h-8" />}
                                        {form.headerType === 'DOCUMENT' && <FileText className="w-8 h-8" />}
                                        <span>{form.headerType}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="whitespace-pre-wrap text-gray-800 mb-2">
                            {form.bodyText ? (
                                <FormattedText text={form.bodyText} />
                            ) : (
                                <span className="text-gray-400">Message body...</span>
                            )}
                        </div>
                        {form.footerText && (
                            <div className="text-[10px] text-gray-500 mb-1">
                                {form.footerText}
                            </div>
                        )}
                        <div className="text-[10px] text-gray-400 text-right">Now</div>
                    </div>
                    {form.buttons.length > 0 && (
                        <div className="mt-2 space-y-1 max-w-[90%]">
                            {form.buttons.map((btn, i) => (
                                <div key={i} className="bg-white text-blue-500 text-center py-2 rounded shadow-sm font-medium cursor-pointer">
                                    {btn.type === 'URL' && <span className="mr-1">🔗</span>}
                                    {btn.type === 'PHONE_NUMBER' && <span className="mr-1">📞</span>}
                                    {btn.text || "Button"}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading && !initialData) return <div className="p-12 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="pt-6 px-6 max-w-7xl mx-auto w-full flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
            </div>
            <TemplateForm
                initialData={initialData}
                onSubmit={handleSubmit}
                loading={loading}
                mode="EDIT"
                renderPreview={renderPreview}
            />
        </div>
    );
}
