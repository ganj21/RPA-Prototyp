*** Settings ***
Library    SeleniumLibrary
Library    OperatingSystem

*** Keywords ***
Append List To File
    [Arguments]    ${filename}    @{values}
    ${exists}=    Run Keyword And Return Status    File Should Exist    ${filename}
    Run Keyword If    not ${exists}    Create File    ${filename}
    FOR    ${val}    IN    @{values}
        Append To File    ${filename}    ${val}\n
    END
