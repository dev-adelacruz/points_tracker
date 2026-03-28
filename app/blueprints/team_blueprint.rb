# frozen_string_literal: true

class TeamBlueprint < Blueprinter::Base
  identifier :id

  fields :name, :description, :active, :host_count

  field :emcee_email do |team|
    team.current_emcee&.email
  end

  field :emcee_id do |team|
    team.current_emcee&.id
  end
end
