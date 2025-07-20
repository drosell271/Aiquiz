"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "./components/ui/Footer";
import Header from "./components/ui/Header";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug i18n
  useEffect(() => {
    console.log('i18n ready:', i18n.isInitialized);
    console.log('Current language:', i18n.language);
    console.log('Available resources:', Object.keys(i18n.getResourceBundle(i18n.language, 'translation') || {}));
    console.log('front.title translation:', t('front.title'));
  }, [i18n, t]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();
      
      if (data.success) {
        setSubjects(data.subjects);
      } else {
        setError('Error loading subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Error loading subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className='container-layout'>
        <Header/>
        <div className="container-content">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">{t("common.loading") || "Loading..."}</div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className='container-layout'>
        <Header/>
        <div className="container-content">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg text-red-600">{error}</div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className='container-layout'> 
     <Header/>
    <div className=" container-content">
  
        <h2 className="text-left text-2xl mb-2 ">
          {t("front.title")}          
        </h2>
        <p>
          {t("front.description")}
        </p>
        <div className="mt-6">
          <div className="text-left text-base md:text-base  font-normal leading-2">
            {/* <h2> Elige la Asignatura:</h2> */}
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 mt-3 gap-3">
            {subjects.map((subject) => (
              <Link
                key={subject._id}
                className="subject-button"
                href={{ pathname: `/quiz/${subject.acronym}` }}
                id={subject.acronym.toLowerCase()}
              >
                <p>{subject.name}</p>
                <p className="subject-acronym">{subject.acronym}</p>
              </Link>
            ))}
          </div>
        </div>
   
    
    </div>
    <Footer />
    </main>
  );
};

export default HomePage;
