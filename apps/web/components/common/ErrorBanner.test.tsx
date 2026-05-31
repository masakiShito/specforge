import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBanner } from "./ErrorBanner";

describe("ErrorBanner", () => {
  describe("rendering", () => {
    it("should render null when message is null", () => {
      // Arrange
      const onDismiss = vi.fn();

      // Act
      const { container } = render(
        <ErrorBanner message={null} onDismiss={onDismiss} />
      );

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("should render error message when provided", () => {
      // Arrange
      const errorMessage = "Something went wrong";
      const onDismiss = vi.fn();

      // Act
      render(<ErrorBanner message={errorMessage} onDismiss={onDismiss} />);

      // Assert
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("should have error styling with red background", () => {
      // Arrange
      const onDismiss = vi.fn();

      // Act
      render(<ErrorBanner message="Error" onDismiss={onDismiss} />);

      // Assert
      const banner = screen.getByText("Error").parentElement;
      expect(banner).toHaveStyle({ backgroundColor: "#FEE2E2" });
    });

    it("should render dismiss button with aria-label", () => {
      // Arrange
      const onDismiss = vi.fn();

      // Act
      render(<ErrorBanner message="Error" onDismiss={onDismiss} />);

      // Assert
      const dismissButton = screen.getByRole("button", { name: "閉じる" });
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onDismiss when dismiss button is clicked", () => {
      // Arrange
      const onDismiss = vi.fn();
      render(<ErrorBanner message="Error" onDismiss={onDismiss} />);

      // Act
      const dismissButton = screen.getByRole("button", { name: "閉じる" });
      fireEvent.click(dismissButton);

      // Assert
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should not call onDismiss automatically on render", () => {
      // Arrange
      const onDismiss = vi.fn();

      // Act
      render(<ErrorBanner message="Error" onDismiss={onDismiss} />);

      // Assert
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe("different message types", () => {
    it("should display long error messages", () => {
      // Arrange
      const longMessage = "This is a very long error message that explains what went wrong in detail and provides helpful information to the user about how to resolve the issue.";
      const onDismiss = vi.fn();

      // Act
      render(<ErrorBanner message={longMessage} onDismiss={onDismiss} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should display error message with special characters", () => {
      // Arrange
      const specialMessage = "エラー: データベース接続に失敗しました。<script>alert('xss')</script>";
      const onDismiss = vi.fn();

      // Act
      render(<ErrorBanner message={specialMessage} onDismiss={onDismiss} />);

      // Assert
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });
});
