/**
 * Copyright (c) 2024 IBM Corporation.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { By, EditorView, SideBarView, TextEditor, VSBrowser } from "vscode-extension-tester";
import * as utils from './utils/testUtils';
import * as constants from './definitions/constants';

const path = require('path');
const assert = require('assert');

describe('LCLS Test for Gradle Project', function () {
    let editor: TextEditor;

    before(() => {
        utils.copyConfig(path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config'),path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config2'));     
    });

    it('should apply quick fix for invalid value in server.xml', async () => {
        const section = await new SideBarView().getContent().getSection(constants.GRADLE_PROJECT);
        section.expand();
        await VSBrowser.instance.openResources(path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config2', 'server.xml'));

        editor = await new EditorView().openEditor('server.xml') as TextEditor;
        const actualSeverXMLContent = await editor.getText();
        const stanzaSnipet = "<logging appsWriteJson = \"wrong\" />";
        const expectedHoverData = "<logging appsWriteJson = \"true\" />";
        await editor.typeTextAt(17, 5, stanzaSnipet);
        await utils.delay(2000);
        const flagedString = await editor.findElement(By.xpath("//*[contains(text(), '\"wrong\"')]"));
        await utils.delay(3000);

        const actions = VSBrowser.instance.driver.actions();
        await actions.move({ origin: flagedString }).perform();
        await utils.delay(3000);

        const driver = VSBrowser.instance.driver;
        const hoverTxt= await editor.findElement(By.className('hover-row status-bar'));
        await utils.delay(2000);

        const qckFixPopupLink = await hoverTxt.findElement(By.xpath("//*[contains(text(), 'Quick Fix')]"));
        await qckFixPopupLink.click();

        const hoverTaskBar = await editor.findElement(By.className('context-view monaco-component bottom left fixed'));
        await hoverTaskBar.findElement(By.className('actionList'));
        await utils.delay(2000);

        const pointerBlockedElement = await driver.findElement(By.css('.context-view-pointerBlock'));
        // Setting pointer block element display value as none to choose option from Quickfix menu
        if (pointerBlockedElement) {
            await driver.executeScript("arguments[0].style.display = 'none';", pointerBlockedElement);
        } else {
            console.log('pointerBlockElementt not found!');
        }
        const qckfixOption = await editor.findElement(By.xpath("//*[contains(text(), \"Replace with 'true'\")]"));
        await qckfixOption.click();

        const updatedSeverXMLContent = await editor.getText();
        await utils.delay(3000);
        console.log("Content after Quick fix : ", updatedSeverXMLContent);
        assert(updatedSeverXMLContent.includes(expectedHoverData), 'Quick fix not applied correctly.');
        await editor.clearText();
        await editor.setText(actualSeverXMLContent);
        console.log("Content restored");

    }).timeout(38000);

    after(() => {
        
        utils.removeProjectFolderWithContent(path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config2'));
        console.log("Removed new config folder:");
      
      });
});