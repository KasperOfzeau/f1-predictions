import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';

export default function Grid2025() {

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col">
        <Head>
            <title>F1 2025 Grid Prediction</title>
        </Head>
        <Navbar />
        <main className="flex-grow p-8">
            <h1 className="text-3xl font-bold mb-8 font-formula1 text-red-500">F1 2025 Grid Prediction</h1>
        </main>
        <footer className="mt-8 p-4 border-t-2 border-red-500 bg-gray-800 text-white text-center">
            <p>Data provided by the <a href="https://ergast.com/mrd/" className="text-red-500 hover:underline">Ergast Motor Racing Data API</a>.</p>
        </footer>
        </div>
    );
}
