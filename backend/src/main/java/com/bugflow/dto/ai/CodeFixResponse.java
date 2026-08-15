package com.bugflow.dto.ai;

public class CodeFixResponse {
    private String rootCause;
    private String codeFixSuggestion;

    public CodeFixResponse() {
    }

    public CodeFixResponse(String rootCause, String codeFixSuggestion) {
        this.rootCause = rootCause;
        this.codeFixSuggestion = codeFixSuggestion;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }

    public String getCodeFixSuggestion() {
        return codeFixSuggestion;
    }

    public void setCodeFixSuggestion(String codeFixSuggestion) {
        this.codeFixSuggestion = codeFixSuggestion;
    }
}
