import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, UserCheck, UserX, Search, RefreshCw, Download, 
  Smartphone, Printer, MapPin, Phone, ShieldCheck, ChevronLeft, 
  ChevronRight, ArrowUpDown, Filter, Eye, X, Copy, Check, 
  LayoutGrid, List, AlertCircle, Building2, Clock, UserSquare2
} from 'lucide-react';

const API_CONFIG = {
  baseUrl: "https://stl-mandaue-api.com",
  token: "Bearer 2860|OCyU72t1DzxdBeSjj3izVKCIcCwHkqNbwjRlxHp5",
  defaultSupervisorId: 2
};

export default function AgentData({ supervisorId = API_CONFIG.defaultSupervisorId }) {
  const [agents, setAgents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [supervisorFilter, setSupervisorFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all"); // all, bound, unbound
  const [viewMode, setViewMode] = useState("table"); // table, grid
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Fetch Agent / Teller & Supervisor Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = {
        'Authorization': API_CONFIG.token,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      };

      const [tellerRes, supervisorRes] = await Promise.all([
        fetch(`${API_CONFIG.baseUrl}/api/accountant/teller?id=${supervisorId}`, { method: 'GET', headers }),
        fetch(`${API_CONFIG.baseUrl}/api/accountant/supervisor?id=${supervisorId}`, { method: 'GET', headers })
      ]);

      if (!tellerRes.ok) {
        throw new Error(`Teller API Error ${tellerRes.status}: ${tellerRes.statusText || 'Failed to fetch teller data'}`);
      }

      const tellerResult = await tellerRes.json();
      const rawTellerList = tellerResult?.data || (Array.isArray(tellerResult) ? tellerResult : []);
      setAgents(Array.isArray(rawTellerList) ? rawTellerList : []);

      if (supervisorRes.ok) {
        const supervisorResult = await supervisorRes.json();
        const rawSupervisorList = supervisorResult?.data || (Array.isArray(supervisorResult) ? supervisorResult : []);
        setSupervisors(Array.isArray(rawSupervisorList) ? rawSupervisorList : []);
      }

      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Fetch data error:", err);
      setErrorMsg(err.message || "Failed to load agent and supervisor records.");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [supervisorId]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchData();
      }
    })();
    return () => { isMounted = false; };
  }, [fetchData]);

  // Lookup map for fast supervisor data access (O(1))
  const supervisorMap = useMemo(() => {
    const map = new Map();
    supervisors.forEach(s => {
      if (s.id !== undefined && s.id !== null) {
        map.set(Number(s.id), s);
        map.set(String(s.id), s);
      }
    });
    return map;
  }, [supervisors]);

  // Helper to get supervisor info
  const getSupervisorInfo = useCallback((supId) => {
    if (supId === undefined || supId === null) return null;
    return supervisorMap.get(supId) || supervisorMap.get(Number(supId)) || null;
  }, [supervisorMap]);

  // Unique supervisor list for filter dropdown displaying Full Name only
  const availableSupervisors = useMemo(() => {
    const map = new Map();
    // First include all supervisors present in the agents list
    agents.forEach(a => {
      if (a.supervisor !== undefined && a.supervisor !== null) {
        const id = Number(a.supervisor);
        const spvrData = supervisorMap.get(id);
        map.set(id, {
          id,
          fullName: spvrData?.fullName || `Supervisor #${id}`
        });
      }
    });

    // Also include other supervisors from API if available
    supervisors.forEach(s => {
      const id = Number(s.id);
      if (!map.has(id)) {
        map.set(id, {
          id,
          fullName: s.fullName || `Supervisor #${id}`
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [agents, supervisors, supervisorMap]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = agents.length;
    const active = agents.filter(a => a.isActive === 1).length;
    const inactive = total - active;
    const multiLogin = agents.filter(a => a.multiLogin === 1).length;
    const boundDevices = agents.filter(a => Boolean(a.deviceId && a.deviceId.trim().length > 0)).length;
    const supervisorCount = availableSupervisors.length;

    return { total, active, inactive, multiLogin, boundDevices, supervisorCount };
  }, [agents, availableSupervisors]);

  // Filtered and Sorted Data
  const processedAgents = useMemo(() => {
    let list = [...agents];

    // Status filter
    if (statusFilter === "active") {
      list = list.filter(a => a.isActive === 1);
    } else if (statusFilter === "inactive") {
      list = list.filter(a => a.isActive === 0);
    }

    // Supervisor filter
    if (supervisorFilter !== "all") {
      list = list.filter(a => String(a.supervisor) === String(supervisorFilter));
    }

    // Device filter
    if (deviceFilter === "bound") {
      list = list.filter(a => Boolean(a.deviceId && a.deviceId.trim().length > 0));
    } else if (deviceFilter === "unbound") {
      list = list.filter(a => !a.deviceId || a.deviceId.trim().length === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => {
        const spvr = supervisorMap.get(Number(a.supervisor));
        const spvrName = spvr?.fullName || '';

        return (
          String(a.id || '').toLowerCase().includes(q) ||
          (a.username || '').toLowerCase().includes(q) ||
          (a.fullName || '').toLowerCase().includes(q) ||
          (a.outlet || '').toLowerCase().includes(q) ||
          (a.location || '').toLowerCase().includes(q) ||
          (a.address || '').toLowerCase().includes(q) ||
          (a.contactNumber || '').toLowerCase().includes(q) ||
          (a.deviceId || '').toLowerCase().includes(q) ||
          String(a.brgyId || '').toLowerCase().includes(q) ||
          spvrName.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      let valA, valB;

      if (sortField === 'supervisor') {
        const spvrA = supervisorMap.get(Number(a.supervisor));
        const spvrB = supervisorMap.get(Number(b.supervisor));
        valA = spvrA?.fullName || '';
        valB = spvrB?.fullName || '';
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (valA < valB) return sortAsc ? -1 : 1;
      return sortAsc ? 1 : -1;
    });

    return list;
  }, [agents, statusFilter, supervisorFilter, deviceFilter, searchQuery, sortField, sortAsc, supervisorMap]);

  // Pagination calculation
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(processedAgents.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAgents = useMemo(() => {
    if (pageSize === 'all') return processedAgents;
    const start = (safeCurrentPage - 1) * pageSize;
    return processedAgents.slice(start, start + pageSize);
  }, [processedAgents, safeCurrentPage, pageSize]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleSupervisorFilterChange = (val) => {
    setSupervisorFilter(val);
    setCurrentPage(1);
  };

  const handleDeviceFilterChange = (val) => {
    setDeviceFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val) => {
    setPageSize(val === 'all' ? 'all' : Number(val));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportToCSV = () => {
    if (!processedAgents.length) {
      alert("No agent records available to export.");
      return;
    }

    const headers = [
      "Agent ID", "Status", "Username", "Full Name", "Outlet Name", 
      "Barangay ID", "Location", "Address", "Contact Number", 
      "Supervisor", "Multi Login", "Device ID", "Printer Setting", 
      "Created At", "Updated At"
    ];

    const rows = processedAgents.map(a => {
      const spvr = getSupervisorInfo(a.supervisor);
      return [
        a.id ?? '',
        a.isActive === 1 ? 'ACTIVE' : 'INACTIVE',
        `"${(a.username || '').replace(/"/g, '""')}"`,
        `"${(a.fullName || '').replace(/"/g, '""')}"`,
        `"${(a.outlet || '').replace(/"/g, '""')}"`,
        `"${a.brgyId ?? ''}"`,
        `"${(a.location || '').replace(/"/g, '""')}"`,
        `"${(a.address || '').replace(/"/g, '""')}"`,
        `"${a.contactNumber ?? ''}"`,
        `"${(spvr?.fullName || 'N/A').replace(/"/g, '""')}"`,
        a.multiLogin === 1 ? 'YES' : 'NO',
        `"${a.deviceId || ''}"`,
        a.printer_setting ?? '',
        `"${a.created_at || ''}"`,
        `"${a.updated_at || ''}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Agents_Tellers_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#002B66] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Tellers</p>
            <p className="text-xl font-black font-mono mt-1 text-slate-900 leading-tight">{metrics.total}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#002B66] border border-blue-100">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Active</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-xl font-black font-mono text-emerald-700 leading-tight">{metrics.active}</p>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                {metrics.total ? `${Math.round((metrics.active / metrics.total) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <UserCheck size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Inactive</p>
            <p className="text-xl font-black font-mono mt-1 text-rose-600 leading-tight">{metrics.inactive}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <UserX size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-purple-600 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Supervisors</p>
            <p className="text-xl font-black font-mono mt-1 text-purple-700 leading-tight">{metrics.supervisorCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <UserSquare2 size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#FFD700] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Multi-Login</p>
            <p className="text-xl font-black font-mono mt-1 text-amber-700 leading-tight">{metrics.multiLogin}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Bound Devices</p>
            <p className="text-xl font-black font-mono mt-1 text-indigo-700 leading-tight">{metrics.boundDevices}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Smartphone size={18} />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search teller, username, supervisor, outlet..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 text-xs rounded-lg focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66] outline-none font-medium transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {lastRefreshed && (
              <span className="text-[10px] text-slate-400 font-mono hidden lg:inline mr-1">
                Synced at {lastRefreshed}
              </span>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#002B66] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#002B66] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid / Card View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              disabled={loading || !processedAgents.length}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Export filtered records to CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 bg-[#002B66] hover:bg-blue-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-bold uppercase text-[10px] tracking-wider mr-1">
            <Filter size={12} />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer hover:border-slate-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Supervisor Filter (FULL NAME ONLY) */}
          <select
            value={supervisorFilter}
            onChange={(e) => handleSupervisorFilterChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer hover:border-slate-300 max-w-xs truncate"
          >
            <option value="all">All Supervisors ({availableSupervisors.length})</option>
            {availableSupervisors.map(sup => (
              <option key={sup.id} value={sup.id}>
                {sup.fullName}
              </option>
            ))}
          </select>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => handleDeviceFilterChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer hover:border-slate-300"
          >
            <option value="all">All Devices</option>
            <option value="bound">Has Device ID</option>
            <option value="unbound">No Device ID</option>
          </select>

          {/* Page size selector */}
          <div className="ml-auto flex items-center gap-2 text-slate-500 font-medium">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-2 py-0.5 text-xs font-bold outline-none cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All ({processedAgents.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button 
            onClick={fetchData} 
            className="bg-rose-600 text-white px-2.5 py-1 rounded-md text-[11px] hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw size={28} className="animate-spin mx-auto text-[#002B66] mb-3" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fetching Agent & Supervisor Records...</p>
          <p className="text-[11px] text-slate-400 mt-1">Connecting to Mandaue Operations API</p>
        </div>
      ) : processedAgents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Users size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Tellers / Agents Found</p>
          <p className="text-[11px] text-slate-400 mt-1">Try resetting your search query or adjusting your filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#002B66] text-white text-[11px] font-bold uppercase tracking-wider border-b border-blue-950 select-none">
                  <th onClick={() => handleSort('id')} className="px-3.5 py-2.5 border-r border-blue-900 cursor-pointer hover:bg-blue-900/60 transition-colors w-16 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>ID</span>
                      <ArrowUpDown size={12} className={sortField === 'id' ? 'text-[#FFD700]' : 'text-blue-300 opacity-60'} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('isActive')} className="px-3 py-2.5 border-r border-blue-900 cursor-pointer hover:bg-blue-900/60 transition-colors w-24 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown size={12} className={sortField === 'isActive' ? 'text-[#FFD700]' : 'text-blue-300 opacity-60'} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('fullName')} className="px-4 py-2.5 border-r border-blue-900 cursor-pointer hover:bg-blue-900/60 transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Teller / Agent</span>
                      <ArrowUpDown size={12} className={sortField === 'fullName' ? 'text-[#FFD700]' : 'text-blue-300 opacity-60'} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('outlet')} className="px-4 py-2.5 border-r border-blue-900 cursor-pointer hover:bg-blue-900/60 transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Outlet / Location</span>
                      <ArrowUpDown size={12} className={sortField === 'outlet' ? 'text-[#FFD700]' : 'text-blue-300 opacity-60'} />
                    </div>
                  </th>
                  <th className="px-3.5 py-2.5 border-r border-blue-900">
                    <span>Contact</span>
                  </th>
                  <th onClick={() => handleSort('supervisor')} className="px-4 py-2.5 border-r border-blue-900 cursor-pointer hover:bg-blue-900/60 transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Supervisor</span>
                      <ArrowUpDown size={12} className={sortField === 'supervisor' ? 'text-[#FFD700]' : 'text-blue-300 opacity-60'} />
                    </div>
                  </th>
                  <th className="px-3.5 py-2.5 border-r border-blue-900">
                    <span>Device ID</span>
                  </th>
                  <th className="px-3 py-2.5 text-center w-20">
                    <span>Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedAgents.map((agent) => {
                  const spvr = getSupervisorInfo(agent.supervisor);
                  const spvrFullName = spvr?.fullName || (agent.supervisor ? `Supervisor #${agent.supervisor}` : 'N/A');

                  return (
                    <tr 
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className="hover:bg-amber-50/60 cursor-pointer transition-colors group"
                    >
                      {/* ID */}
                      <td className="px-3.5 py-2.5 border-r border-slate-100 text-center font-mono font-bold text-slate-600">
                        #{agent.id}
                      </td>

                      {/* Status Badge */}
                      <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          agent.isActive === 1
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive === 1 ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          {agent.isActive === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Full Name & Username */}
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <div className="font-bold text-[#002B66] uppercase text-xs group-hover:text-blue-700">
                          {agent.fullName || 'N/A'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                          <span>@{agent.username}</span>
                          {agent.multiLogin === 1 && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-1 py-0.2 rounded font-sans font-bold" title="Multi-login enabled">
                              Multi
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Outlet & Location */}
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <div className="font-semibold text-slate-800 text-xs">
                          {agent.outlet || 'No Outlet Name'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-xs" title={agent.location || agent.address || ''}>
                          <MapPin size={11} className="shrink-0 text-slate-400" />
                          <span className="truncate">{agent.location || agent.address || `Brgy ID: ${agent.brgyId || 'N/A'}`}</span>
                        </div>
                      </td>

                      {/* Contact Number */}
                      <td className="px-3.5 py-2.5 border-r border-slate-100 font-mono text-xs text-slate-700">
                        {agent.contactNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span>{agent.contactNumber}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(agent.contactNumber, `contact-${agent.id}`);
                              }}
                              className="text-slate-400 hover:text-[#002B66] p-1 rounded transition-colors"
                              title="Copy contact number"
                            >
                              {copiedField === `contact-${agent.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Supervisor Full Name ONLY */}
                      <td className="px-4 py-2.5 border-r border-slate-100 font-bold text-slate-800 uppercase text-xs">
                        <span className="truncate block" title={spvrFullName}>
                          {spvrFullName}
                        </span>
                      </td>

                      {/* Device ID */}
                      <td className="px-3.5 py-2.5 border-r border-slate-100 font-mono text-[11px] text-slate-600">
                        {agent.deviceId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[120px]" title={agent.deviceId}>
                              {agent.deviceId}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(agent.deviceId, `device-${agent.id}`);
                              }}
                              className="text-slate-400 hover:text-[#002B66] p-1 rounded transition-colors"
                              title="Copy Device ID"
                            >
                              {copiedField === `device-${agent.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unbound</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(agent);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#002B66] hover:text-white text-slate-600 transition-all cursor-pointer"
                          title="View Full Profile"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedAgents.map((agent) => {
            const spvr = getSupervisorInfo(agent.supervisor);
            const spvrFullName = spvr?.fullName || (agent.supervisor ? `Supervisor #${agent.supervisor}` : 'N/A');

            return (
              <div 
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#002B66] text-[#FFD700] flex items-center justify-center font-black text-xs uppercase shadow-xs">
                        {agent.fullName ? agent.fullName.slice(0, 2) : 'TL'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#002B66] group-hover:text-blue-700 uppercase line-clamp-1">
                          {agent.fullName || 'Unnamed Teller'}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500 font-semibold">@{agent.username}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      agent.isActive === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {agent.isActive === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{agent.outlet || 'No Outlet Name'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{agent.location || agent.address || 'Mandaue City'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{agent.contactNumber || 'No Contact Number'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Supervisor:</span>
                    <span className="font-bold text-[#002B66] uppercase text-xs truncate max-w-[200px]" title={spvrFullName}>
                      {spvrFullName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-50">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      agent.deviceId ? 'bg-blue-50 text-[#002B66] border border-blue-100' : 'text-slate-400 italic'
                    }`}>
                      {agent.deviceId ? 'Device Bound' : 'No Device'}
                    </span>
                    <span className="font-semibold text-slate-400">
                      Brgy: #{agent.brgyId || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {processedAgents.length > 0 && pageSize !== 'all' && (
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-medium text-[11px]">
            Showing <span className="font-bold text-slate-900">{((safeCurrentPage - 1) * pageSize) + 1}</span> to{' '}
            <span className="font-bold text-slate-900">{Math.min(safeCurrentPage * pageSize, processedAgents.length)}</span> of{' '}
            <span className="font-bold text-slate-900">{processedAgents.length}</span> tellers
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-slate-700"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safeCurrentPage <= 3) {
                pageNum = i + 1;
              } else if (safeCurrentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safeCurrentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    safeCurrentPage === pageNum
                      ? 'bg-[#002B66] text-[#FFD700] font-black shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Agent Details Inspector Modal */}
      {selectedAgent && (() => {
        const modalSpvr = getSupervisorInfo(selectedAgent.supervisor);
        const modalSpvrFullName = modalSpvr?.fullName || (selectedAgent.supervisor ? `Supervisor #${selectedAgent.supervisor}` : 'N/A');

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#002B66] rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-[#002B66] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-[#FFD700]">
                <div className="flex items-center gap-2.5 font-black uppercase tracking-wider text-xs">
                  <Users size={18} className="text-[#FFD700]" />
                  <span>Teller Account Profile — #{selectedAgent.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedAgent(null)} 
                  className="text-slate-300 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                {/* Account Quick Summary Card */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#002B66] text-[#FFD700] flex items-center justify-center font-black text-sm uppercase shadow-sm">
                      {selectedAgent.fullName ? selectedAgent.fullName.slice(0, 2) : 'TL'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#002B66] uppercase">{selectedAgent.fullName || 'N/A'}</h3>
                      <p className="text-xs font-mono text-slate-500 font-bold mt-0.5">@{selectedAgent.username}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      selectedAgent.isActive === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${selectedAgent.isActive === 1 ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                      {selectedAgent.isActive === 1 ? 'Active Status' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Supervisor Details Card - FULLNAME ONLY */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-2xs">
                  <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Assigned Supervisor</span>
                  <span className="font-black text-[#002B66] text-sm uppercase block">{modalSpvrFullName}</span>
                </div>

                {/* Profile Details Grid */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs shadow-2xs">
                  <h4 className="font-sans font-black text-[11px] text-[#002B66] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                    <Building2 size={14} />
                    <span>Outlet & Location Specifications</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Outlet Name</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">{selectedAgent.outlet || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Barangay ID</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">Brgy #{selectedAgent.brgyId || 'N/A'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Address</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">{selectedAgent.address || 'N/A'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Location</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">{selectedAgent.location || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Contact Number</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-slate-800 text-xs">{selectedAgent.contactNumber || 'N/A'}</span>
                        {selectedAgent.contactNumber && (
                          <button
                            onClick={() => copyToClipboard(selectedAgent.contactNumber, 'modal-contact')}
                            className="text-slate-400 hover:text-[#002B66] p-1 rounded"
                            title="Copy Contact Number"
                          >
                            {copiedField === 'modal-contact' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hardware & System Configuration */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs shadow-2xs">
                  <h4 className="font-sans font-black text-[11px] text-[#002B66] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                    <Smartphone size={14} />
                    <span>Hardware & System Configuration</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Multi-Login Permission</span>
                      <span className={`font-bold text-xs mt-0.5 inline-block ${selectedAgent.multiLogin === 1 ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {selectedAgent.multiLogin === 1 ? 'Enabled (1)' : 'Disabled (0)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Printer Setting</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block flex items-center gap-1">
                        <Printer size={13} className="text-slate-500" />
                        Mode {selectedAgent.printer_setting ?? 'N/A'}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400 font-sans text-[10px] font-bold uppercase block">Bound Device ID</span>
                      <div className="flex items-center gap-2 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="font-mono text-xs text-slate-800 font-bold truncate flex-1">
                          {selectedAgent.deviceId || 'No Device ID bound'}
                        </span>
                        {selectedAgent.deviceId && (
                          <button
                            onClick={() => copyToClipboard(selectedAgent.deviceId, 'modal-device')}
                            className="bg-white border border-slate-200 text-slate-600 hover:text-[#002B66] px-2 py-1 rounded text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            {copiedField === 'modal-device' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            <span>{copiedField === 'modal-device' ? 'Copied' : 'Copy ID'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between gap-2 text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Created: {selectedAgent.created_at ? new Date(selectedAgent.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span>Updated: {selectedAgent.updated_at ? new Date(selectedAgent.updated_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setSelectedAgent(null)} 
                  className="px-5 py-2 rounded-lg bg-[#002B66] hover:bg-blue-900 text-white font-black cursor-pointer uppercase text-xs transition-all shadow-md active:scale-95"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
