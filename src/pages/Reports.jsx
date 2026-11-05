import React, { useState, useEffect } from 'react';
import { 
  officersAPI, armouryAPI, munitionAPI, 
  ammunitionAPI, transactionsAPI 
} from '../utils/api'; // Adjust path to your api.js
import { 
  FileText, Download, Search, Shield, 
  Bomb, Target, Users, RefreshCw, 
  Filter, ChevronRight, LayoutGrid
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('armoury');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'armoury', label: 'Weaponry Systems', icon: Shield },
    { id: 'munitions', label: 'Munitions/Grenades', icon: Bomb },
    { id: 'ammunition', label: 'Ammunition Stock', icon: Target },
    { id: 'officers', label: 'Personnel Records', icon: Users },
    { id: 'used', label: 'Used Items & Empty Cases', icon: FileText },
  ];

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'armoury') res = await armouryAPI.getAll();
      if (activeTab === 'munitions') res = await munitionAPI.getAll();
      if (activeTab === 'ammunition') res = await ammunitionAPI.getAll();
      if (activeTab === 'officers') res = await officersAPI.getAll();
      if (activeTab === 'used') res = await transactionsAPI.getUsedMaterials({ limit: 200 });
      
      setData(res.data.data || []);
    } catch (err) {
      toast.error('Data Retrieval Interrupted');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
    XLSX.writeFile(workbook, `KSP_REPORT_${activeTab.toUpperCase()}_${new Date().getTime()}.xlsx`);
    toast.success('Dossier Exported to Excel');
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* HEADER COMMAND BAR */}
      <header className="w-full bg-[#F1F5F9] border-b border-gray-300 px-4 py-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 shadow-lg">
              <FileText className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Intelligence Reports</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Generated: {new Date().toLocaleDateString()} // Secure Access</p>
            </div>
          </div>
          
          <button
            onClick={exportToExcel}
            className="w-full md:w-auto bg-slate-900 hover:bg-red-700 text-white px-8 py-3.5 flex items-center justify-center gap-3 transition-all border-l-4 border-red-500 shadow-xl"
          >
            <Download size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Generate Excel Dossier</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 space-y-6">
        
        {/* TABS SELECTOR */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 p-5 border transition-all ${
                activeTab === tab.id 
                ? 'bg-white border-slate-900 border-l-4 border-l-red-600 shadow-md' 
                : 'bg-[#F1F5F9] border-gray-200 opacity-60 hover:opacity-100 hover:bg-white'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-red-600' : 'text-slate-400'} />
              <span className={`text-[11px] font-black uppercase tracking-wider ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white border border-gray-300 shadow-sm p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={`FILTER ${activeTab.toUpperCase()} RECORDS...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-gray-200 py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-slate-900 transition-all"
            />
          </div>
          <button onClick={fetchReportData} className="px-6 bg-[#F1F5F9] border border-gray-200 text-slate-600 hover:text-slate-900 transition-all">
             <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* DATA GRID / TABLE */}
        <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-gray-300 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">REF_ID</th>
                  {activeTab === 'armoury' && <>
                    <th className="px-8 py-5">System Type</th>
                    <th className="px-8 py-5">Serial / Reg No</th>
                    <th className="px-8 py-5">Butt Number</th>
                    <th className="px-8 py-5">Status</th>
                  </>}
                  {activeTab === 'munitions' && <>
                    <th className="px-8 py-5">Designation</th>
                    <th className="px-8 py-5">Batch No</th>
                    <th className="px-8 py-5 text-red-600">Available Stock</th>
                    <th className="px-8 py-5">Expiry Schedule</th>
                  </>}
                  {activeTab === 'ammunition' && <>
                    <th className="px-8 py-5">Caliber/Type</th>
                    <th className="px-8 py-5">Current Qty</th>
                    <th className="px-8 py-5 text-red-600">Warning Threshold</th>
                    <th className="px-8 py-5 text-right">Last Updated</th>
                  </>}
                  {activeTab === 'officers' && <>
                    <th className="px-8 py-5">Officer Name</th>
                    <th className="px-8 py-5">Rank</th>
                    <th className="px-8 py-5 text-red-600">KGID No</th>
                    <th className="px-8 py-5 text-right">Unit Assignment</th>
                  </>}
                  {activeTab === 'used' && <>
                    <th className="px-8 py-5">Item / Type</th>
                    <th className="px-8 py-5">Officer</th>
                    <th className="px-8 py-5">Consumed</th>
                    <th className="px-8 py-5">Empty Cases Received</th>
                    <th className="px-8 py-5">Missing Cases</th>
                    <th className="px-8 py-5">Recorded</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="7" className="px-8 py-20 text-center text-[10px] font-black text-slate-400 animate-pulse tracking-[0.5em]">SYNCHRONIZING SECURE DATABASE...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-red-50/50 transition-colors italic group text-[11px] font-bold">
                      <td className="px-8 py-4 font-mono text-slate-400 text-[10px]">#{idx + 1001}</td>
                      
                      {activeTab === 'armoury' && <>
                        <td className="px-8 py-4 text-slate-900 uppercase">{item.type}</td>
                        <td className="px-8 py-4 font-mono text-red-600 uppercase">{item.registerNumber}</td>
                        <td className="px-8 py-4 text-slate-700 uppercase">{item.buttNumber}</td>
                        <td className="px-8 py-4">
                           <span className={`px-2 py-1 text-[9px] font-black uppercase ${item.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                             {item.status}
                           </span>
                        </td>
                      </>}

                      {activeTab === 'munitions' && <>
                        <td className="px-8 py-4 text-slate-900 uppercase">{item.name}</td>
                        <td className="px-8 py-4 font-mono text-slate-600 uppercase">{item.batchNumber}</td>
                        <td className="px-8 py-4 text-red-600 font-black">{item.availableCount} UNITS</td>
                        <td className="px-8 py-4 text-slate-500 uppercase">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                      </>}

                      {activeTab === 'ammunition' && <>
                        <td className="px-8 py-4 text-slate-900 uppercase">{item.type}</td>
                        <td className="px-8 py-4 text-slate-700 font-black">{item.availableCount}</td>
                        <td className="px-8 py-4 text-red-600 uppercase font-black">{item.minimumStockLevel} MIN</td>
                        <td className="px-8 py-4 text-right text-slate-400 font-mono uppercase">{new Date(item.updatedAt).toLocaleDateString()}</td>
                      </>}

                      {activeTab === 'officers' && <>
                        <td className="px-8 py-4 text-slate-900 uppercase font-black tracking-tighter">{item.name}</td>
                        <td className="px-8 py-4 text-slate-600 uppercase italic">{item.rank}</td>
                        <td className="px-8 py-4 text-red-600 font-black uppercase">{item.kgidNo}</td>
                        <td className="px-8 py-4 text-right text-slate-500 uppercase">{item.company || 'GEN_POOL'}</td>
                      </>}
                      {activeTab === 'used' && <>
                        <td className="px-8 py-4 text-slate-900 uppercase">{item.itemName} <span className="text-slate-400">({item.itemType})</span></td>
                        <td className="px-8 py-4 text-slate-700 uppercase">{item.officerId?.name || 'Unknown'}</td>
                        <td className="px-8 py-4 text-amber-700 font-black">{item.consumedCount || 0}</td>
                        <td className="px-8 py-4 text-emerald-700 font-black">{item.emptyCasesReceived || 0}</td>
                        <td className="px-8 py-4 text-red-700 font-black">{item.missingCasesCount || 0}</td>
                        <td className="px-8 py-4 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                      </>}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="px-8 py-20 text-center text-xs font-black text-slate-300 uppercase italic">No records found matching current query</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Total Entries Filtered" value={filteredData.length} />
          <MetricCard label="System Integrity" value="VERIFIED" color="text-green-600" />
          <MetricCard label="Clearance Level" value="LEVEL_3" color="text-red-600" />
        </div>
      </main>
    </div>
  );
};

const MetricCard = ({ label, value, color = "text-slate-900" }) => (
  <div className="bg-white border border-gray-300 p-6 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">{label}</span>
    <span className={`text-3xl font-black italic tracking-tighter uppercase ${color}`}>{value}</span>
  </div>
);

export default Reports;