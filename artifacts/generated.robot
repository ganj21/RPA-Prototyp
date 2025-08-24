*** Settings ***
Library    SeleniumLibrary

*** Test Cases ***
Generated Workflow
    Open Browser    about:blank    Chrome
    # Unsupported node type: 
    Go To    https://quotes.toscrape.com/page/2/
    Wait Until Page Contains Element    p.text-muted a    timeout=10s
    Click Element    p.text-muted a
    Wait Until Element Is Visible    #explore_search_query    timeout=5s
    Input Text    #explore_search_query    Albert Einstein
    @Albert_quote=    Get Texts    div.quote:nth-child(5) > div:nth-child(1) > div:nth-child(2)
    Append List To File    albert.txt    ${Albert_quote}
    # Unsupported node type: 
    Close Browser