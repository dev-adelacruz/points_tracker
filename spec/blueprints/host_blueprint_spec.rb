# frozen_string_literal: true

require "rails_helper"
require "./spec/support/shared_examples/blueprints/blueprint"

RSpec.describe HostBlueprint do
  describe "#render" do
    let(:record) { create(:user, :host) }

    it_behaves_like "a blueprint" do
      let(:expected_keys) { %i[id name email active team_id team_name badges] }
      let(:custom_attributes) do
        { team_id: record.primary_team&.id, team_name: record.primary_team&.name, badges: [] }
      end
    end
  end
end
