# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Emcees" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee1) { create(:user, :emcee) }
  let(:emcee2) { create(:user, :emcee) }
  let(:host) { create(:user, :host) }
  let(:team) { create(:team) }

  describe "#index" do
    path "/api/v1/emcees" do
      get "lists all emcees with their team assignments (admin only)" do
        tags "Emcees"
        produces "application/json"

        response(200, "returns all emcees with teams for admin") do
          before do
            emcee1
            emcee2
            create(:team_membership, user: emcee1, team: team)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(2)
            emcee1_data = json_response[:data].find { |e| e[:id] == emcee1.id }
            expect(emcee1_data[:teams].length).to eq(1)
            expect(emcee1_data[:teams].first[:name]).to eq(team.name)
          end
        end

        response(200, "returns emcee with no teams") do
          before do
            emcee1
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            emcee1_data = json_response[:data].find { |e| e[:id] == emcee1.id }
            expect(emcee1_data[:teams]).to be_empty
          end
        end

        response(403, "returns forbidden for non-admin") do
          before { sign_in emcee1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized when not signed in") do
          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end
end
