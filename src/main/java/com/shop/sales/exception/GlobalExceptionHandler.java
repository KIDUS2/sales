package com.shop.sales.exception;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ApiException.class)
  ResponseEntity<Map<String, String>> api(ApiException e) { return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage())); }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException e) {
    var f = e.getBindingResult().getFieldError();
    return ResponseEntity.badRequest().body(Map.of("message", f == null ? "Invalid request" : f.getField() + " " + f.getDefaultMessage()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<Map<String, String>> conflict(DataIntegrityViolationException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Duplicate or invalid data"));
  }
}
