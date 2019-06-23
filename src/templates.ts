export const templateSuccess = `
{{#if before}}

{{ before }}

{{/if}}

{{#if showNewLogs}}
<!--START_LOG-->
##### \`{{ command }}\`

\`\`\`
{{{ content }}}
\`\`\`
<!--END_LOG-->
{{/if}}

{{#if after}}

{{ after }}

{{/if}}

{{#if showOldLogs}}
{{#if lastLog}}
---
{{/if}}

<!--START_OLD_LOGS-->
{{#if lastLog}}
<details>
  <summary>Failed build for <code>{{ lastCommit }}</code></summary>

{{{ lastLog }}}

</details>
{{/if}}

{{{ oldLogs }}}
<!--END_OLD_LOGS-->
{{/if}}

<!--LAST_COMMIT={{ commit }}-->`;

export const templateFailure = `
{{#if before}}

{{ before }}

{{/if}}

{{#if showNewLogs}}
<!--START_LOG-->
##### \`{{ command }}\`

\`\`\`
{{{ content }}}
\`\`\`
<!--END_LOG-->
{{/if}}

{{#if after}}

{{ after }}

{{/if}}

{{#if showOldLogs}}
{{#if lastLog}}
---
{{/if}}

<!--START_OLD_LOGS-->
{{#if lastLog}}
<details>
  <summary>Failed build for <code>{{ lastCommit }}</code></summary>

{{{ lastLog }}}

</details>
{{/if}}

{{{ oldLogs }}}
<!--END_OLD_LOGS-->
{{/if}}

<!--LAST_COMMIT={{ commit }}-->`;
