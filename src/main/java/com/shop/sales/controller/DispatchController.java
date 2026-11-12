package com.shop.sales.controller;

import com.shop.sales.dto.*;
import com.shop.sales.service.DispatchService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/dispatches") @RequiredArgsConstructor
public class DispatchController {
    private final DispatchService service;

    @GetMapping public List<DispatchView> all() { return service.all(); }
    @GetMapping("/mine") public List<DispatchView> mine() { return service.mine(); }
    @GetMapping("/{id}") public DispatchView get(@PathVariable Long id) { return service.get(id); }
    @PostMapping public DispatchView issue(@Valid @RequestBody IssueRequest r) { return service.issue(r); }
    @PostMapping("/{id}/close") public DispatchView close(@PathVariable Long id, @Valid @RequestBody CloseDispatchRequest r) { return service.close(id, r); }
}
