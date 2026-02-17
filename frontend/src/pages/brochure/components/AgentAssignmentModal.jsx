import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../../components/ui/dialog";
import { Search, Check, User, Mail, Shield, X, Users } from 'lucide-react';
import axios from 'axios';
import apiClient from '../../../services/apiClient';
import { toast } from 'react-hot-toast';

const AgentAssignmentModal = ({ open, onOpenChange, selectedUniversityIds, onAssignmentComplete }) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedAgentIds, setSelectedAgentIds] = useState([]);
    const [assigning, setAssigning] = useState(false);

    const isEditMode = selectedUniversityIds.length === 1;

    useEffect(() => {
        if (open) {
            fetchAgents();
            if (isEditMode) {
                fetchExistingAssignments();
            } else {
                setSelectedAgentIds([]);
            }
        }
    }, [open, selectedUniversityIds]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            // Fetching all approved agents for selection
            const response = await apiClient.get('/agents?limit=1000&status=approved');
            setAgents(response.data.data || []);
        } catch (error) {
            console.error('Error fetching agents:', error);
            toast.error('Failed to load agents');
        } finally {
            if (!isEditMode) setLoading(false);
        }
    };

    const fetchExistingAssignments = async () => {
        try {
            const universityId = selectedUniversityIds[0];
            const response = await apiClient.get(`/agent-university/university/${universityId}/agents`);
            const assignedAgentIds = (response.data.data || []).map(a =>
                typeof a.agentId === 'object' ? a.agentId._id : a.agentId
            );
            setSelectedAgentIds(assignedAgentIds);
        } catch (error) {
            console.error('Error fetching existing assignments:', error);
            toast.error('Failed to load existing assignments');
        } finally {
            setLoading(false);
        }
    };

    const toggleAgent = (id) => {
        setSelectedAgentIds(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const filteredAgentIds = filteredAgents.map(a => a._id);
        const allSelected = filteredAgentIds.every(id => selectedAgentIds.includes(id));

        if (allSelected) {
            setSelectedAgentIds(prev => prev.filter(id => !filteredAgentIds.includes(id)));
        } else {
            setSelectedAgentIds(prev => Array.from(new Set([...prev, ...filteredAgentIds])));
        }
    };

    const handleAssign = async () => {
        setAssigning(true);
        try {
            if (isEditMode) {
                // Sync specific university agents
                await apiClient.post(`/agent-university/university/${selectedUniversityIds[0]}/sync-agents`, {
                    agentIds: selectedAgentIds
                });
                toast.success('Agent assignments updated successfully');
            } else {
                // Bulk assign to multiple universities
                if (selectedAgentIds.length === 0) {
                    toast.error('Please select at least one agent');
                    setAssigning(false);
                    return;
                }
                await apiClient.post('/agent-university/univerity-broucher-bulk-assign', {
                    universityIds: selectedUniversityIds,
                    agentIds: selectedAgentIds
                });
                toast.success('Assignment completed successfully');
            }
            onAssignmentComplete();
            onOpenChange(false);
        } catch (error) {
            console.error('Assignment error:', error);
            toast.error(error.response?.data?.message || 'Failed to update assignments');
        } finally {
            setAssigning(false);
        }
    };

    const filteredAgents = agents.filter(agent => {
        const name = `${agent.firstName} ${agent.lastName}`.toLowerCase();
        const email = agent.email.toLowerCase();
        const company = (agent.companyName || '').toLowerCase();
        const query = search.toLowerCase();
        return name.includes(query) || email.includes(query) || company.includes(query);
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        {isEditMode ? 'Manage Assignments' : 'Assign to Agents'}
                    </DialogTitle>
                    <p className="text-sm text-gray-500">
                        {isEditMode
                            ? 'Update agent access for this university. Deselecting an agent will revoke their access.'
                            : `Assign ${selectedUniversityIds.length} universities to selected agents.`
                        }
                    </p>
                </DialogHeader>

                <div className="px-6 py-2 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search agents by name, email or company..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        {filteredAgents.every(a => selectedAgentIds.includes(a._id)) ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredAgents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredAgents.map(agent => (
                                <div
                                    key={agent._id}
                                    onClick={() => toggleAgent(agent._id)}
                                    className={`
                                        relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                                        ${selectedAgentIds.includes(agent._id)
                                            ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${selectedAgentIds.includes(agent._id) ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                <User className={`h-4 w-4 ${selectedAgentIds.includes(agent._id) ? 'text-blue-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">
                                                    {agent.firstName} {agent.lastName}
                                                </h4>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                                    <Mail className="h-3 w-3" />
                                                    {agent.email}
                                                </div>
                                                {agent.companyName && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                        <Shield className="h-3 w-3" />
                                                        {agent.companyName}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedAgentIds.includes(agent._id) && (
                                            <div className="bg-blue-600 rounded-full p-1 shadow-sm">
                                                <Check className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${agent.status === 'active' ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}
                                    >
                                        {agent.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Users className="h-10 w-10 mb-2 opacity-20" />
                            <p>No agents found matching your search.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm font-medium text-gray-600">
                            {selectedAgentIds.length} Agents Selected
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAssign}
                                disabled={assigning || (!isEditMode && selectedAgentIds.length === 0)}
                                className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium min-w-[140px] flex items-center justify-center transition-all ${assigning || (!isEditMode && selectedAgentIds.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                            >
                                {assigning ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        {isEditMode ? 'Updating...' : 'Assigning...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Update Assignments' : 'Assign Selected'
                                )}
                            </button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AgentAssignmentModal;
