/**
 * Utility functions for handling WhatsApp Message Templates and their variables.
 */

export type TemplateVariable = {
    name: string;      // The variable name/index, e.g., "1" or "first_name"
    component: "HEADER" | "BODY" | "BUTTON";
    originalMatch: string; // The full match, e.g., "{{1}}"
    index?: number;        // For buttons, the button index (0, 1, or 2)
};

/**
 * Extracts all variables from a template's components.
 * Supports positional {{1}} and named {{var_name}} formats.
 */
export function getTemplateVariables(components: any[]): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const seen = new Set<string>();

    if (!Array.isArray(components)) return [];

    components.forEach((component) => {
        if ((component.type === "BODY" || (component.type === "HEADER" && component.format === "TEXT")) && component.text) {
            // Regex to match {{anything}}
            const regex = /\{\{([^}]+)\}\}/g;
            let match;

            while ((match = regex.exec(component.text)) !== null) {
                const varName = match[1].trim();
                const key = `${component.type}:${varName}`;

                if (!seen.has(key)) {
                    variables.push({
                        name: varName,
                        component: component.type as "HEADER" | "BODY",
                        originalMatch: match[0]
                    });
                    seen.add(key);
                }
            }
        }
        if (component.type === "BUTTONS" && Array.isArray(component.buttons)) {
            component.buttons.forEach((btn: any, btnIdx: number) => {
                if (btn.type === "URL" && btn.url) {
                    const regex = /\{\{([^}]+)\}\}/g;
                    let match;
                    while ((match = regex.exec(btn.url)) !== null) {
                        const varName = match[1].trim();
                        const key = `BUTTON:${btnIdx}:${varName}`;
                        if (!seen.has(key)) {
                            variables.push({
                                name: varName,
                                component: "BUTTON",
                                originalMatch: match[0],
                                index: btnIdx
                            });
                            seen.add(key);
                        }
                    }
                }
            });
        }
    });

    // Sort positional variables numerically if possible, otherwise keep alphabetical
    return variables.sort((a, b) => {
        const numA = parseInt(a.name);
        const numB = parseInt(b.name);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.name.localeCompare(b.name);
    });
}

/**
 * Formats variable values into the structure required by Meta's API.
 * Currently supports TEXT type variables.
 */
export function formatTemplateParameters(variables: TemplateVariable[], values: Record<string, string>) {
    // Meta expects parameters per component
    const bodyParams = variables
        .filter(v => v.component === "BODY")
        .map(v => ({
            type: "text",
            text: values[v.name] || ""
        }));

    const headerParams = variables
        .filter(v => v.component === "HEADER")
        .map(v => ({
            type: "text",
            text: values[v.name] || ""
        }));

    // Buttons are unique - they need sub_type and index
    const buttons = variables
        .filter(v => v.component === "BUTTON")
        .reduce((acc: any[], v) => {
            const btnIndex = v.index ?? 0;
            let btn = acc.find(b => b.index === btnIndex.toString());
            if (!btn) {
                btn = {
                    type: "button",
                    sub_type: "url",
                    index: btnIndex.toString(),
                    parameters: []
                };
                acc.push(btn);
            }
            btn.parameters.push({
                type: "text",
                text: values[`btn_${btnIndex}_${v.name}`] || values[v.name] || ""
            });
            return acc;
        }, []);

    return {
        header: headerParams,
        body: bodyParams,
        buttons
    };
}
