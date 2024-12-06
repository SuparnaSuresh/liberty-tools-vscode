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

describe('LCLS tests for Gradle Project', function () {
    let editor: TextEditor;

    before(() => {
        utils.copyConfig(path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config'), path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config2'));
    });

    it('Should apply quick fix for invalid value in server.xml', async () => {
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
        await utils.delay(7000);

        const actions = VSBrowser.instance.driver.actions();
        await actions.move({ origin: flagedString }).perform();
        await utils.delay(3000);

        const driver = VSBrowser.instance.driver;
        const hoverTxt = await editor.findElement(By.className('hover-row status-bar'));
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
        assert(updatedSeverXMLContent.includes(expectedHoverData), 'Quick fix not applied correctly for the invalid value in server.xml.');
        await editor.clearText();
        await editor.setText(actualSeverXMLContent);
        await utils.delay(3000);
        console.log("Content restored");

    }).timeout(38000);

    it('Should show hover support for server.xml Liberty Server Attribute', async () => {

        await VSBrowser.instance.openResources(path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config2', 'server.xml'));
        editor = await new EditorView().openEditor('server.xml') as TextEditor;

        const actualSeverXMLContent = await editor.getText();
        const hovrExpctdOutcome = `Configuration properties for an HTTP endpoint.`;

        console.log(hovrExpctdOutcome);
        const focusTargtElemnt = editor.findElement(By.xpath("//*[contains(text(), 'httpEndpoint')]"));
        await utils.delay(3000);
        focusTargtElemnt.click();
        await editor.click();

        const actns = VSBrowser.instance.driver.actions();
        await actns.move({ origin: focusTargtElemnt }).perform();
        await utils.delay(5000);

        const hverContent = editor.findElement(By.className('hover-contents'));
        const hoveredText = await hverContent.getText();
        console.log("Hover text:" + hoveredText);

        assert(hoveredText.includes(hovrExpctdOutcome), 'Did not get expected hover data Liberty Server Attribute.');
        await editor.clearText();
        await editor.setText(actualSeverXMLContent);
        await utils.delay(3000);
        console.log("Content restored");

    }).timeout(35000);

    it('Should show hover support for server.xml Liberty Server Feature', async () => {

        await VSBrowser.instance.openResources(path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config', 'server.xml'));
        editor = await new EditorView().openEditor('server.xml') as TextEditor;

        const hverExpectdOutcome = `Description: This feature provides support for the MicroProfile Health specification.`;
        const testHverTarget = '<feature>mpHealth-4.0</feature>';

        await editor.typeTextAt(15, 35, '\n');
        await utils.delay(1000);
        await editor.typeTextAt(16, 9, testHverTarget);
        const focusTargtElemnt = editor.findElement(By.xpath("//*[contains(text(), 'mpHealth')]"));
        await utils.delay(3000);
        focusTargtElemnt.click();
        await editor.click();

        const actns = VSBrowser.instance.driver.actions();
        await actns.move({ origin: focusTargtElemnt }).perform();
        await utils.delay(5000);

        const hverContent = editor.findElement(By.className('hover-contents'));
        const hverValue = await hverContent.getText();
        console.log("Hover text:" + hverValue);

        assert(hverValue.includes(hverExpectdOutcome), 'Did not get expected hover data Liberty Server Feature.');

    }).timeout(33000);

    after(() => {
        utils.removeConfigDir(path.join(utils.getGradleProjectPath(), 'src', 'main', 'liberty', 'config2'));
        console.log("Removed new config folder:");
    });

});