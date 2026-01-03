// ============================================
// EMAIL TEMPLATE PREVIEW COMPONENT
// ============================================

import { useState, useEffect } from 'react';
import { api, type EmailTemplate } from '../services/api';

interface EmailPreviewProps {
    templateId: string;
    onClose: () => void;
}

export function EmailPreview({ templateId, onClose }: EmailPreviewProps) {
    const [template, setTemplate] = useState<EmailTemplate | null>(null);
    const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTemplate() {
            try {
                const [templateRes, previewRes] = await Promise.all([
                    api.getEmailTemplate(templateId),
                    api.previewEmailTemplate(templateId)
                ]);
                setTemplate(templateRes.data);
                setPreview(previewRes.data);
            } catch (error) {
                console.error('Failed to load template:', error);
            } finally {
                setLoading(false);
            }
        }
        loadTemplate();
    }, [templateId]);

    if (loading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal email-preview-modal" onClick={e => e.stopPropagation()}>
                    <div className="loading">Loading template...</div>
                </div>
            </div>
        );
    }

    if (!template || !preview) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal email-preview-modal large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">📧 {template.name}</h3>
                        <p className="modal-subtitle">{template.description}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* Template Info */}
                    <div className="template-info">
                        <div className="info-row">
                            <strong>Subject:</strong>
                            <span>{preview.subject}</span>
                        </div>
                        <div className="info-row">
                            <strong>Variables:</strong>
                            <div className="variables-list">
                                {template.variables.map(v => (
                                    <span key={v} className="variable-tag">{'{{' + v + '}}'}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Email Preview */}
                    <div className="email-preview-container">
                        <div className="email-preview-header">
                            <span>📱 Email Preview</span>
                        </div>
                        <iframe
                            srcDoc={preview.html}
                            title="Email Preview"
                            className="email-iframe"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    <button className="btn btn-primary">
                        ✏️ Edit Template
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// EMAIL TEMPLATES LIST
// ============================================

interface EmailTemplatesListProps {
    onPreview: (templateId: string) => void;
}

export function EmailTemplatesList({ onPreview }: EmailTemplatesListProps) {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTemplates() {
            try {
                const res = await api.getEmailTemplates();
                setTemplates(res.data);
            } catch (error) {
                console.error('Failed to load templates:', error);
            } finally {
                setLoading(false);
            }
        }
        loadTemplates();
    }, []);

    if (loading) {
        return <div className="loading">Loading templates...</div>;
    }

    return (
        <div className="email-templates-grid">
            {templates.map(template => (
                <div key={template.id} className="email-template-card">
                    <div className="template-icon">📧</div>
                    <div className="template-content">
                        <h4>{template.name}</h4>
                        <p>{template.description}</p>
                        <div className="template-variables">
                            {template.variables.slice(0, 3).map(v => (
                                <span key={v} className="variable-tag small">{'{{' + v + '}}'}</span>
                            ))}
                            {template.variables.length > 3 && (
                                <span className="variable-more">+{template.variables.length - 3}</span>
                            )}
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onPreview(template.id)}
                    >
                        👁️ Preview
                    </button>
                </div>
            ))}
        </div>
    );
}
