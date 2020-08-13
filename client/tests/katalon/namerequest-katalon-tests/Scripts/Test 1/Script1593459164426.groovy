import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

WebUI.openBrowser('')

WebUI.navigateToUrl('http://localhost:8080/namerequest/')

WebUI.switchToWindowTitle('test')

WebUI.setText(findTestObject('Page_test/input_Corporation_name-input-text-field'), 'BLUE HERON TOURS LTD.')

WebUI.click(findTestObject('Object Repository/Page_test/button_search'))

WebUI.click(findTestObject('Object Repository/Page_test/label_I want to send my name to be examined'))

WebUI.click(findTestObject('Object Repository/Page_test/span_Send for Examination'))

WebUI.click(findTestObject('Object Repository/Page_test/span_Continue'))

WebUI.setText(findTestObject('Object Repository/Page_test/input_Applicant_lastname'), 'LOPATKA')

WebUI.setText(findTestObject('Object Repository/Page_test/input_Applicant_firstName'), 'LUCAS')

WebUI.click(findTestObject('Object Repository/Page_test/div_Applicant_v-text-field__slot'))

