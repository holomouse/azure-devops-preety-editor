// ==UserScript==
// @name         Azure DevOps YAML & PowerShell Highlighter
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Improve syntax highlighting in Azure DevOps YAML and use Monaco's built-in PowerShell highlighting for pwsh steps
// @author       Piotr Zaborowski
// @match        https://dev.azure.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    function enhanceHighlighting() {
        const monaco = window.monaco;
        if (!monaco || !monaco.editor) {
            console.warn("❌ Monaco editor not found.");
            return;
        }

        console.log("✅ Monaco editor detected. Applying syntax enhancements...");

        // Register PowerShell language for embedded scripting inside YAML
        monaco.languages.register({ id: 'powershell2' });
        monaco.languages.setMonarchTokensProvider('powershell2', {
            tokenizer: {
                root: [
                    [/(Get|Set|New|Write|Remove|Start|Stop|Restart|Invoke|Test|Enable|Disable|Clear|Export|Import|Convert|Format|Exists)-[a-zA-Z]+/, 'type'],
                    [/(function|param|begin|process|end|filter|class|enum|break|continue|do|switch|throw|trap|try|catch|finally)/, 'keyword.control'],
                    [/(if|else|elseif|foreach|while|return)/, 'control.flow'],
                    [/#.*/, 'comment'],
                    [/".*?"|'.*?'/, 'string'],
                    [/\[[a-zA-Z_][\w]*\]/, 'type'],
                    [/\$[a-zA-Z_][\w]*/, 'variable'],
                    [/\$\{[a-zA-Z_][\w]*\}/, 'variable.bracketed'],
                    [/\$\([a-zA-Z_][\w]*\)/, 'variable.bracketed'],
                    // Updated number pattern
                    [/(?:^|[\s,\(\[\{])(-?\d+(?:\.\d+)?)(?=[\s,\)\]\}]|$)/, 'number'],
                    [/(@{[^}]*})/, 'object'],
                    [/(\[[a-zA-Z_][a-zA-Z0-9_]*\])/, 'type']
                ]
            }
        });

        // Register and define YAML highlighting for Azure DevOps
        monaco.languages.register({ id: 'azure-yaml' });
        monaco.languages.setMonarchTokensProvider('azure-yaml', {
            tokenizer: {
                root: [
                    [/^\s*\b(trigger|pool|steps|stages|jobs|parameters|variables|schedules|resources|extends|pr|pipelines|source|tags|repositories|containers|name|services|strategy|matrix|demands|vmImage|parallel|deployment|lifecycle|hook|environment|strategy|runOnce|canary|rolling|queue|demands)\b/, 'keyword'],
                    [/^\s*-\s*(template|dependsOn|checkout|task|workspace|name|download|upload|publish|group|path|artifact|secure|object|string|number|boolean|step|script|bash|python|node|deployment|group)\b/, 'type'],
                    [/^\s*(value|default|values|displayName|timeoutInMinutes|retryCountOnTaskFailure|failOnStderr|continueOnError|enabled|inputs|workingDirectory|clean|fetchDepth|lfs|submodules|persistCredentials|condition|target|percent|increment|healthCheck|pool|workspace|container|service|endpoint|subscription|tenant|key|secret|registry|path|include|exclude|batch|branches|tags|paths|always|none|auto|version|region|resourceGroup|maxParallel|prependPath|targetPath|rootFolderOrFile|includeRootFolder|archiveType|replaceExistingArchive)\b/, 'type.identifier'],
                    [/\b(true|false|null)\b/, 'constant'],
                    [/"[^"\\]*(?:\\.[^"\\]*)*"/, 'string'],
                    [/'[^'\\]*(?:\\.[^'\\]*)*'/, 'string'],
                    [/#.*/, 'comment'],
                    [/(?:^|[\s,\[])(-?\d+(?:\.\d+)?)(?=[\s,\]]|$)/, 'number'], // Only match standalone numbers
                    [/\$\{\{[^}]+\}\}/, 'variable.embedded'], // Match variables in ${{ this }} form
                    [/\b[a-zA-Z_][\w]*\b/, 'identifier'], // Add this before number pattern
                    [/(?:^|[\s,\[\{])(-?\d+(?:\.\d+)?)(?=[\s,\]\}]|$)/, 'number'],
                    [/^(\s*)(?:-\s*)?pwsh:\s*(\|)?$/, { token: 'keyword', next: '@pwshblock' }],
                ],
                pwshblock: [
                    [/^\s+.*$/, {
                        token: '@rematch',
                        nextEmbedded: 'powershell2'
                    }],
                    [/^(?!\s)/, {
                        token: '@rematch',
                        next: '@pop',
                        nextEmbedded: '@pop'
                    }]
                ]
            }
        });

        monaco.languages.setLanguageConfiguration('powershell2', {
            comments: { lineComment: '#' },
            brackets: [['{', '}'], ['[', ']'], ['(', ')']],
            autoClosingPairs: [
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: '(', close: ')' }
            ]
        });

        monaco.languages.setLanguageConfiguration('azure-yaml', {
            comments: { lineComment: '#' },
            brackets: [['{', '}'], ['[', ']'], ['(', ')']],
            autoClosingPairs: [
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: '(', close: ')' }
            ]
        });

        function applyHighlighting() {
            const editorModel = monaco.editor.getModels()[0];

            if (editorModel) {
                console.log("✅ YAML editor detected. Applying Azure YAML highlighting...");
                monaco.editor.setModelLanguage(editorModel, 'azure-yaml');
            } else {
                console.warn("❌ No YAML model found in Monaco.");
            }
        }

        applyHighlighting();
        monaco.editor.onDidCreateModel(applyHighlighting); // Reapply if a new model is created
    }

    function waitForEditor() {
        if (window.monaco && monaco.editor.getModels().length > 0) {
            enhanceHighlighting();
        } else {
            setTimeout(waitForEditor, 1000);
        }
    }

    waitForEditor();
})();
