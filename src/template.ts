export const template: string = `
# {{title}}

{{#releases}}
## Release {{title}}

    {{#changes}}
* {{title}} ({{#if link}}[#{{id}}]({{link}}){{~else}}#{{id}}{{~/if}})

        {{#commits}}

            {{#if repeat}}
            *
            {{~else}}
            
            **{{scope~}}:**
            
            *
            {{~/if}}
            
             {{subject}} ([{{~hash~}}]({{~@root.host~}}/{{~@root.owner~}}/{{~@root.repository~}}/{{~@root.commit~}}/{{~hash~}}))

        {{/commits}}
    {{/changes}}
{{/releases}}
`;