# frozen_string_literal: true

module CompanyScoped
  extend ActiveSupport::Concern

  private

  def current_company
    @current_company ||= Company.first
  end
end
