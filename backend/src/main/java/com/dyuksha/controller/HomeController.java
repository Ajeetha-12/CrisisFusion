package com.dyuksha.controller;

import com.dyuksha.dto.AllocationPlan;
import com.dyuksha.model.Emergency;
import com.dyuksha.model.ResourceType;
import com.dyuksha.service.AllocationOrchestratorService;
import com.dyuksha.service.EmergencyService;
import com.dyuksha.service.ResourceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

/**
 * HomeController — serves the command center views.
 *
 * <p>Phase 4: both emergency and multi-agency resource data are dynamically
 * pulled from the H2 database and injected into the command center.</p>
 */
@Controller
public class HomeController {

    private static final Logger log = LoggerFactory.getLogger(HomeController.class);

    private final EmergencyService emergencyService;
    private final ResourceService resourceService;
    private final AllocationOrchestratorService allocationOrchestratorService;

    public HomeController(EmergencyService emergencyService,
                          ResourceService resourceService,
                          AllocationOrchestratorService allocationOrchestratorService) {
        this.emergencyService = emergencyService;
        this.resourceService = resourceService;
        this.allocationOrchestratorService = allocationOrchestratorService;
    }

    @GetMapping("/")
    public String dashboard(Model model) {
        long activeEmergencies = emergencyService.countActive();
        long criticalEmergencies = emergencyService.countCritical();

        long availableAmbulances = resourceService.countAvailableByType(ResourceType.AMBULANCE);
        long availableRescueTeams = resourceService.countAvailableByType(ResourceType.FIRE_AND_RESCUE);
        long availablePoliceUnits = resourceService.countAvailableByType(ResourceType.POLICE_UNIT);

        List<Map<String, Object>> emergencyPoints = emergencyService.getActiveForMap();
        List<Map<String, Object>> resourcePoints = resourceService.getActiveForMap();
        Map<String, List<Map<String, Object>>> groupedResources = resourceService.getGroupedResourcesForDashboard();
        List<Map<String, Object>> recentActivity = emergencyService.getRecentActivity(8);

        model.addAttribute("pageTitle", "Command Center");
        model.addAttribute("activePage", "dashboard");

        // Stat cards
        model.addAttribute("activeEmergencies", activeEmergencies);
        model.addAttribute("criticalEmergencies", criticalEmergencies);
        model.addAttribute("availableAmbulances", availableAmbulances);
        model.addAttribute("availableRescueTeams", availableRescueTeams);
        model.addAttribute("availablePoliceUnits", availablePoliceUnits);

        // Data for JS map and tabs
        model.addAttribute("emergencyMapData", emergencyPoints);
        model.addAttribute("resourceMapData", resourcePoints);
        model.addAttribute("groupedResourcesData", groupedResources);
        model.addAttribute("recentActivityData", recentActivity);

        // AI recommendation surfacing: auto-analyze the highest-priority active incident
        addAiRecommendation(model);

        return "dashboard";
    }

    /**
     * Computes a live allocation plan for the highest-priority active emergency so the
     * dashboard can surface AI recommendations without requiring the operator to navigate
     * to the allocation console. Fails safe — the dashboard still renders if the engine throws.
     */
    private void addAiRecommendation(Model model) {
        try {
            List<Emergency> prioritized = emergencyService.getActiveByPriority();
            if (prioritized.isEmpty()) {
                return;
            }
            Emergency top = prioritized.get(0);
            AllocationPlan plan = allocationOrchestratorService.generatePlan(top.getId());
            model.addAttribute("aiPlan", plan);
            model.addAttribute("aiTopRecommendations",
                    plan.getRecommendations().stream()
                            .filter(r -> r.isRecommended())
                            .limit(3)
                            .toList());
        } catch (Exception ex) {
            log.warn("AI recommendation preview unavailable: {}", ex.getMessage());
        }
    }
}
