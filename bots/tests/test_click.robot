*** Settings ***
Library    SeleniumLibrary

*** Test Cases ***
Click Test
    Open Browser    https://quotes.toscrape.com    
    Maximize Browser Window
    Wait Until Page Contains Element    span.tag-item:nth-child(2) > a:nth-child(1)    timeout=10s
    Click Element    a.tag[href="/tag/love/"]
    Sleep    2s
    Close Browser

