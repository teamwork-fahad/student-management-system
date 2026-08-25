import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  Users,
  PlusCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
} from "lucide-react";

export const Parties = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    fetchParties();
  }, [statusFilter]);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/expenses/parties", { params });
      setParties(res.data?.data?.parties || []);
    } catch (err) {
      console.error("Fetch parties error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (party = null) => {
    setError("");
    if (party) {
      setEditingParty(party);
      setName(party.name || "");
      setContactPerson(party.contactPerson || "");
      setMobile(party.mobile || "");
      setEmail(party.email || "");
      setAddress(party.address || "");
      setNotes(party.notes || "");
      setStatus(party.status || "ACTIVE");
    } else {
      setEditingParty(null);
      setName("");
      setContactPerson("");
      setMobile("");
      setEmail("");
      setAddress("");
      setNotes("");
      setStatus("ACTIVE");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Party name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        mobile: mobile.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      };

      if (editingParty) {
        await api.put(`/expenses/parties/${editingParty.id}`, payload);
      } else {
        await api.post("/expenses/parties", payload);
      }

      setIsModalOpen(false);
      fetchParties();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save party.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, partyName) => {
    if (!window.confirm(`Are you sure you want to delete party '${partyName}'?`)) return;
    try {
      await api.delete(`/expenses/parties/${id}`);
      fetchParties();
    } catch (err) {
      alert("Failed to delete party.");
    }
  };

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.mobile || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredParties.length / itemsPerPage) || 1;
  const paginatedParties = filteredParties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" /> Party / Vendor Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage payee parties, vendors, contractors, and corporate expense payees.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Add New Party</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by party name, contact person, phone, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-transparent border-none text-xs font-bold text-slate-900 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-950">All Statuses</option>
            <option value="ACTIVE" className="bg-white dark:bg-slate-950">Active Parties</option>
            <option value="INACTIVE" className="bg-white dark:bg-slate-950">Inactive Parties</option>
          </select>
        </div>
      </div>

      {/* Party Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading parties...</div>
        ) : filteredParties.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">No party records found.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Party Name</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Mobile / Email</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Transactions</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedParties.map((party) => (
                  <tr key={party.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <Link to={`/dashboard/finance/parties/${party.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                        {party.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {party.contactPerson || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      <div>{party.mobile || "No Mobile"}</div>
                      {party.email && <div className="text-[10px] text-slate-400 truncate">{party.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                        party.status === "ACTIVE"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                      }`}>
                        {party.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {party._count?.expenses || 0} Records
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => navigate(`/dashboard/finance/parties/${party.id}`)}
                          className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition"
                          title="View Party Details & Financial History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(party)}
                          className="p-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white rounded-lg transition"
                          title="Edit Party"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(party.id, party.name)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition"
                          title="Delete Party"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PARTY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-[500px] max-h-[calc(100vh-24px)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white my-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold">{editingParty ? "Edit Party" : "Add New Party"}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Party / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Suppliers, Broadband Corp, Tech Solutions"
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Representative Name"
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@company.com"
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 font-bold cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Pincode"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal remarks..."
                  className="w-full h-[40px] px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingParty ? "Update Party" : "Create Party"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parties;
