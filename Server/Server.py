from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import pickle
import docx
import PyPDF2
import re
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup

app = Flask(__name__, static_folder="../Client/dist", static_url_path="/")
CORS(app)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Path to pre-trained models
model_path = os.path.join(os.path.dirname(__file__), "Models")

# Load pre-trained models
svc_model = pickle.load(open(os.path.join(model_path, 'clf.pkl'), 'rb'))
tfidf = pickle.load(open(os.path.join(model_path, 'tfidf.pkl'), 'rb'))
le = pickle.load(open(os.path.join(model_path, 'encoder.pkl'), 'rb'))


@app.route("/")
@app.route("/content")
def serve():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/matches", methods=["POST"])
def handle_file_upload():
    print("[DEBUG] /matches endpoint triggered")  # Confirm endpoint is hit

    if "resume" not in request.files:
        print("[ERROR] No file part in request")
        return jsonify({"error": "No file uploaded"}), 400
    
    if "frequency" not in request.form:
        print("[ERROR] No frequency in request")
        return jsonify({"error": "No frequency uploaded"}), 400
    
    if "location" not in request.form:
        print("[ERROR] No location in request")
        return jsonify({"error": "No location uploaded"}), 400
    
    frequency = request.form["frequency"]
    print(f"[DEBUG] Frequency: {frequency}")
    
    location = request.form["location"]
    location = location.strip()
    print(f"[DEBUG] Location: {location}")
    

    uploaded_file = request.files["resume"]
    if uploaded_file.filename == "":
        print("[ERROR] Empty filename")
        return jsonify({"error": "Empty file"}), 400

    try:
        # Save file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_file.filename)
        print(f"[DEBUG] Saving file to: {file_path}")
        uploaded_file.save(file_path)

        # Extract and predict
        #print("[DEBUG] File saved successfully. Extracting text...")
        resume_text = extract_text_from_file(file_path)
        #print("[DEBUG] Extracted text successfully")
        
        predicted_category = pred(resume_text)
        #print("[DEBUG] Predicted category:", predicted_category)
        
        if location != "Not specific" and location != "":
            job_listings = scrape_jobs(predicted_category,frequency,location)
        else:
            job_listings = scrape_jobs(predicted_category,frequency)
        #print("[DEBUG] Scraped job listings successfully")
        
        print("[DEBUG] Returning response")
        print(job_listings[0])
        return jsonify({
            "job_listings": job_listings,
            "predicted_category": predicted_category
        })
    except Exception as e:
        print("[ERROR] Exception in try block:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        print("[DEBUG] Cleaning up temporary file...")
        if os.path.exists(file_path):
            os.remove(file_path)



def cleanResume(txt):
    cleanText = re.sub(r'http\S+\s', ' ', txt)
    cleanText = re.sub(r'RT|cc', ' ', cleanText)
    cleanText = re.sub(r'#\S+\s', ' ', txt)
    cleanText = re.sub(r'@\S+', '  ', cleanText)
    cleanText = re.sub(r'[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', cleanText)
    cleanText = re.sub(r'[^\x00-\x7f]', ' ', cleanText)
    cleanText = re.sub(r'\s+', ' ', cleanText)
    return cleanText


def extract_text_from_file(file_path):
    ext = file_path.split('.')[-1].lower()
    if ext == 'pdf':
        return extract_text_from_pdf(file_path)
    elif ext == 'docx':
        return extract_text_from_docx(file_path)
    elif ext == 'txt':
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    else:
        raise ValueError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")


def extract_text_from_pdf(file):
    with open(file, 'rb') as pdf_file:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        return ''.join(page.extract_text() for page in pdf_reader.pages)


def extract_text_from_docx(file):
    doc = docx.Document(file)
    return '\n'.join(paragraph.text for paragraph in doc.paragraphs)


def pred(input_resume):
    cleaned_text = cleanResume(input_resume)
    vectorized_text = tfidf.transform([cleaned_text])
    predicted_category = svc_model.predict(vectorized_text.toarray())
    return le.inverse_transform(predicted_category)[0]


def scrape_jobs(predicted_category, frequency, location=""):
    job_listings = []
    id_counter = 1  # Unique ID for each job listing

    # Function to create a new WebDriver instance
    def create_driver():
        return webdriver.Chrome()

    def Nakuri(job_listings, predicted_category, frequency, location, id_counter):
        driver = create_driver()
        driver.minimize_window()
        wait = WebDriverWait(driver, 15)
        try:
            driver.get("https://www.naukri.com/")
            print("Naukri Website loaded successfully.")

            input_search = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Enter skills / designations / companies']")))
            input_search.send_keys(predicted_category)

            location_search = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Enter location']")))
            location_search.send_keys(location)

            search_button = wait.until(EC.element_to_be_clickable((By.XPATH, '//*[contains(@class, "qsbSubmit")]')))
            search_button.click()

            wait.until(EC.presence_of_all_elements_located((By.CLASS_NAME, "sjw__tuple")))
            print("Naukri Job postings loaded.")

            current_page = 1
            max_pages = int(frequency)

            while current_page <= max_pages:
                print(f"Naukri - Scraping page {current_page}...")

                soup = BeautifulSoup(driver.page_source, 'lxml')
                postings = soup.find_all('div', class_='sjw__tuple')

                for posting in postings:
                    title_element = posting.find('a', class_='title')
                    company_element = posting.find('a', class_='comp-name')
                    location_element = posting.find('span', class_='locWdth')

                    if title_element and company_element and location_element:
                        job_listings.append({
                            "id": id_counter,
                            "title": title_element.get_text(strip=True),
                            "company_name": company_element.get_text(strip=True),
                            "location": location_element.get_text(strip=True),
                            "link": title_element.get('href')
                        })
                        id_counter += 1

                try:
                    next_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[normalize-space()='Next']")))
                    next_button.click()
                    time.sleep(3)
                except:
                    print("Naukri - No more pages.")
                    break

                current_page += 1
        except Exception as e:
            print(f"Naukri Scraper Error: {e}")
        finally:
            driver.quit()
            print("Naukri Browser closed.")

    def SimplyHired(job_listings, predicted_category, frequency, location, id_counter):
        driver = create_driver()
        driver.minimize_window()
        wait = WebDriverWait(driver, 15)
        try:
            driver.get("https://www.simplyhired.co.in/")
            print("SimplyHired Website loaded successfully.")

            job_search = wait.until(EC.visibility_of_element_located((By.NAME, "q")))
            job_search.send_keys(predicted_category)

            location_search = wait.until(EC.visibility_of_element_located((By.NAME, "l")))
            location_search.send_keys(Keys.BACK_SPACE * 30)  # Clear existing input
            location_search.send_keys(location)

            search_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="findJobsSearchSubmit"]')))
            search_button.click()

            wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, '[data-testid="searchSerpJob"]')))
            print("SimplyHired Job postings loaded.")

            current_page = 1
            max_pages = int(frequency)

            while current_page <= max_pages:
                print(f"SimplyHired - Scraping page {current_page}...")

                soup = BeautifulSoup(driver.page_source, 'lxml')
                postings = soup.find_all('div', {'data-testid': 'searchSerpJob'})

                for posting in postings:
                    title_element = posting.find('a', class_='chakra-button css-1djbb1k')
                    company_element = posting.find('span', {'data-testid': 'companyName'})
                    location_element = posting.find('span', {'data-testid': 'searchSerpJobLocation'})

                    if title_element and company_element and location_element:
                        job_listings.append({
                            "id": id_counter,
                            "title": title_element.get_text(strip=True),
                            "company_name": company_element.get_text(strip=True),
                            "location": location_element.get_text(strip=True),
                            "link": 'https://www.simplyhired.co.in/'+title_element.get('href')
                        })
                        id_counter += 1

                try:
                    next_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="pageNumberBlockNext"]')))
                    next_button.click()
                    time.sleep(3)
                except:
                    print("SimplyHired - No more pages.")
                    break

                current_page += 1
        except Exception as e:
            print(f"SimplyHired Scraper Error: {e}")
        finally:
            driver.quit()
            print("SimplyHired Browser closed.")

    # Run both scrapers in parallel
    with ThreadPoolExecutor(max_workers=2) as executor:
        executor.submit(Nakuri, job_listings, predicted_category, frequency, location, id_counter)
        executor.submit(SimplyHired, job_listings, predicted_category, frequency, location, id_counter)

    return job_listings  # Return the scraped job listings

        

if __name__ == "__main__":
    app.run()
